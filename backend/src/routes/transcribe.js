import express from "express";
import multer from "multer";
import FormData from "form-data";
import axios from "axios";
import { getBearerApiKey, GROQ_BASE_URL } from "../lib/groqClient.js";
import { MODEL_WHISPER } from "../lib/prompts.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
});

/**
 * POST /api/transcribe
 * multipart/form-data: field "audio" (file)
 * Headers: Authorization: Bearer <GROQ_API_KEY>
 */
router.post("/", upload.single("audio"), async (req, res, next) => {
  try {
    const apiKey = getBearerApiKey(req);
    if (!req.file || !req.file.buffer) {
      const err = new Error('Missing audio file; use multipart field "audio".');
      err.statusCode = 400;
      err.code = "MISSING_AUDIO";
      throw err;
    }

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "audio.webm",
      contentType: req.file.mimetype || "application/octet-stream",
    });
    form.append("model", MODEL_WHISPER);
    if (req.body.language) {
      form.append("language", String(req.body.language));
    }

    const url = `${GROQ_BASE_URL}/audio/transcriptions`;
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${apiKey}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120_000,
      validateStatus: () => true,
    });

    if (response.status >= 400) {
      const msg =
        (response.data && (response.data.error?.message || response.data.message)) ||
        `Groq transcription failed (${response.status})`;
      const err = new Error(msg);
      err.statusCode = response.status >= 500 ? 502 : 400;
      err.code = "GROQ_TRANSCRIBE_ERROR";
      err.details = response.data;
      throw err;
    }

    const text = typeof response.data?.text === "string" ? response.data.text : "";
    res.json({
      text,
      model: MODEL_WHISPER,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
