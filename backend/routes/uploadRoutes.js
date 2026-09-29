import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        quality: 'auto:low',
        fetch_format: 'auto',
        width: 1280,
        crop: 'limit',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }
    const result = await streamUpload(req.file.buffer);
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

export default router;
