import "dotenv/config";
import express from "express";
import cors from "cors";

import transcribeRouter from "./routes/transcribe.js";
import suggestionsRouter from "./routes/suggestions.js";
import chatRouter from "./routes/chat.js";
import settingsRouter from "./routes/settings.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    exposedHeaders: ["Content-Type"],
  }),
);

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "twinmind-backend" });
});

app.use("/api/transcribe", transcribeRouter);
app.use("/api/suggestions", suggestionsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/settings", settingsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TwinMind backend listening on http://localhost:${PORT}`);
});
