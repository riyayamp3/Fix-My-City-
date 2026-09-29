import multer from "multer";

const ALLOWED_MIME_TYPES = [
  "audio/aac",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/webm",
];

// Multer instance with memory storage, 10 MB limit, and MIME filter
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
      err.code = "UNSUPPORTED_MIME";
      cb(err);
    }
  },
});

// Internal transcribe logic
async function _transcribe(req, res) {
  const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

  if (!SARVAM_API_KEY) {
    return res.status(503).json({ error: "STT service not configured" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  // Build multipart/form-data for Sarvam API
  // Sarvam expects the file in a `file` field (not `audio`)
  const { Blob } = await import("buffer");
  const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });

  const formData = new FormData();
  const filename = req.file.originalname ?? "recording.aac";
  formData.append("file", audioBlob, filename);
  formData.append("model", "saaras:v3");
  formData.append("mode", "transcribe");

  // Use languageHint if provided, otherwise let Sarvam auto-detect
  const languageHint = req.body?.languageHint;
  formData.append("language_code", languageHint ?? "unknown");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let sttResponse;
  try {
    sttResponse = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": SARVAM_API_KEY },
      body: formData,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Transcription timed out" });
    }
    return res.status(502).json({ error: "STT service unavailable" });
  } finally {
    clearTimeout(timeoutId);
  }

  let sttData;
  try {
    sttData = await sttResponse.json();
  } catch {
    return res.status(502).json({ error: "STT service unavailable" });
  }

  if (!sttResponse.ok) {
    return res.status(502).json({ error: "STT service unavailable" });
  }

  const transcript = sttData.transcript ?? "";
  const detectedLanguage = sttData.language_code ?? null;
  const confidence = sttData.language_probability ?? 0.0;

  if (!transcript) {
    return res.status(200).json({ transcript: "", detectedLanguage: null, confidence: 0.0 });
  }

  return res.status(200).json({ transcript, detectedLanguage, confidence });
}

// Export transcribe as a middleware that handles multer errors internally
export function transcribe(req, res, next) {
  upload.single("audio")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Audio file too large" });
      }
      if (err.code === "UNSUPPORTED_MIME") {
        return res.status(415).json({ error: "Unsupported audio format" });
      }
      return next(err);
    }
    _transcribe(req, res).catch(next);
  });
}
