import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import transcribeRouter from "./routes/transcribe.js";
import suggestionsRouter from "./routes/suggestions.js";
import chatRouter from "./routes/chat.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── API Routes ──────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/transcribe", transcribeRouter);
app.use("/api/suggestions", suggestionsRouter);
app.use("/api/chat", chatRouter);

// ── Serve React Frontend ────────────────────────────────────
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));

// All non-API routes serve React index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TwinMind running on http://localhost:${PORT}`);
});

export default app;