import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const storage = multer.memoryStorage();
export const upload = multer({ storage });

const VALID_CATEGORIES = ["pothole", "garbage", "water_leak", "streetlight", "road_damage", "power_cut", "other"];
const VALID_SEVERITIES = ["low", "medium", "high"];

const BLIP_API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large";

// ── Cloudinary upload ─────────────────────────────────────────────────────────
function uploadToCloudinary(buffer, mimetype) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "civic-complaints" },
      (error, result) => {
        if (error || !result) return reject(error || new Error("No result from Cloudinary"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// ── BLIP caption via HuggingFace Inference API ────────────────────────────────
async function getBlipCaption(imageBuffer) {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s max — don't block Gemini

  try {
    const res = await fetch(BLIP_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // 503 = model loading (cold start) — skip gracefully
    if (res.status === 503) {
      console.warn("BLIP model is loading (cold start) — skipping caption");
      return null;
    }

    if (!res.ok) {
      console.warn("BLIP API returned", res.status, "— skipping caption");
      return null;
    }

    const data = await res.json();
    const caption = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    console.log("BLIP caption:", caption);
    return caption ?? null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("BLIP skipped:", err?.name === "AbortError" ? "timeout" : err?.message);
    return null;
  }
}

// ── Gemini civic classification ───────────────────────────────────────────────
function buildGeminiPrompt(blipCaption) {
  const captionContext = blipCaption
    ? `A vision model has described this image as: "${blipCaption}"\n\n`
    : "";

  return `${captionContext}You are a civic issue detection AI. Analyze this image and determine if it shows a real civic infrastructure problem such as: pothole, road damage, broken pipeline, water leak, garbage dumping, broken streetlight, sewage overflow, damaged footpath, or similar public infrastructure issues.

STRICT RULES:
- Only accept images that clearly show a civic/public infrastructure problem
- Reject selfies, people, animals, indoor scenes, food, vehicles (unless showing road damage), nature scenes, or anything unrelated to civic issues
- If the image is unclear or ambiguous, mark as NOT a civic issue
- Use the vision model description above as additional context if provided

If it IS a civic issue, return JSON with:
- isCivicIssue: true
- category: one of [pothole, garbage, water_leak, streetlight, road_damage, power_cut, other]
- severity: one of [low, medium, high] based on urgency
- description: a clear 1-2 sentence description of the specific problem visible in the image

If it is NOT a civic issue, return JSON with:
- isCivicIssue: false
- category: null
- severity: null
- description: null

Return ONLY valid JSON, no markdown, no explanation.`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function analyzeImage(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: "AI service not configured" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  // 1. Upload to Cloudinary
  let imageUrl;
  try {
    imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
  } catch {
    return res.status(502).json({ error: "Image upload failed" });
  }

  // 2. Get BLIP caption (non-blocking — failure is fine)
  const blipCaption = await getBlipCaption(req.file.buffer);

  // 3. Gemini classification (with BLIP caption as context)
  let responseText;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = buildGeminiPrompt(blipCaption);

    const geminiCall = model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: req.file.mimetype, data: req.file.buffer.toString("base64") } },
    ]);

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 55000)
    );

    const result = await Promise.race([geminiCall, timeout]);
    responseText = result.response.text();
    console.log("Gemini raw response:", responseText);
  } catch (err) {
    console.error("Gemini error:", err?.message || err);
    if (err.message === "TIMEOUT") {
      return res.status(504).json({ error: "AI analysis timed out" });
    }
    return res.status(504).json({ error: "AI analysis failed: " + (err?.message || "unknown") });
  }

  // 4. Parse and validate Gemini response
  let parsed;
  try {
    const cleaned = responseText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return res.status(422).json({ error: "AI returned unparseable response" });
  }

  const isCivicIssue = Boolean(parsed.isCivicIssue);
  let category = null;
  let severity = null;
  let description = null;

  if (isCivicIssue) {
    const rawCategory = typeof parsed.category === "string" ? parsed.category.toLowerCase() : "";
    category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "other";

    const rawSeverity = typeof parsed.severity === "string" ? parsed.severity.toLowerCase() : "";
    severity = VALID_SEVERITIES.includes(rawSeverity) ? rawSeverity : "low";

    description = typeof parsed.description === "string" ? parsed.description : null;
  }

  return res.status(200).json({
    isCivicIssue, category, severity, description, imageUrl,
    blipCaption: blipCaption ?? undefined, // included for transparency/debugging
  });
}
