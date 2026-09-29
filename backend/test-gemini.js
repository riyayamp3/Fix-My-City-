import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

console.log("Testing Gemini with key:", process.env.GEMINI_API_KEY?.slice(0, 10) + "...");

try {
  const result = await model.generateContent("Say hello in one word.");
  console.log("Gemini response:", result.response.text());
} catch (e) {
  console.error("Gemini failed:", e.message);
}
