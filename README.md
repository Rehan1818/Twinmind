# AI Meeting Copilot — Live Suggestions Engine

A 3‑panel web app that **listens to live microphone audio**, transcribes speech, and continuously surfaces **3 high‑value suggestions** (questions, talking points, fact checks, clarifications). Clicking a suggestion opens a **detailed answer** in a streaming chat panel.

This repo includes:
- **Frontend**: React 18 + Vite, plain CSS, ESM, no UI libraries
- **Backend**: Node.js + Express (ESM), Groq Whisper + Groq GPT‑OSS 120B

## Demo

- **Live URL**: https://twinmind-cu7k.onrender.com/

## Screenshots

Create `assets/` at the repo root and add screenshots with these names:

- `assets/01-panel.png` — The screen of Copilot engine 
- `assets/02-settings.png` — settings modal (API key + prompts)
- `assets/03-export.png` — exported JSON example


Then the images below will render on GitHub:

<img width="1919" height="860" alt="image" src="https://github.com/user-attachments/assets/bb0de8b1-3589-4efd-9066-cb8ecdf49e9c" />
<br/>
<img width="1919" height="861" alt="image" src="https://github.com/user-attachments/assets/fe0534e9-bc81-4b87-9429-09b61b87f71f" />
<br/>
<img width="1330" height="617" alt="image" src="https://github.com/user-attachments/assets/5974ad19-1d23-42d7-b0a3-419b3e3edcd6" />


## Features

- **Mic capture + chunked transcription**: records audio with `MediaRecorder` and sends ~30s chunks for transcription
- **Live suggestions every ~30s**: auto refresh + manual refresh button
- **Exactly 3 suggestions per refresh**: newest batch prepended; old batches preserved
- **Chat with streaming answers**: SSE token streaming, one session per page load
- **Export**: downloads full session JSON (transcript + suggestion batches + chat) with timestamps
- **Editable prompts + context window**: update suggestion/chat prompts and context lines in Settings
- **No login / no persistence**: everything is local (browser memory + localStorage for settings)

## Architecture (high‑level)

### Data flow

1. **Frontend mic** → captures audio chunks (`audio/webm;codecs=opus`) every 30 seconds  
2. **`POST /api/transcribe`** → Groq **Whisper Large V3** → returns text chunk  
3. **Transcript** accumulates in the left panel  
4. Every ~30 seconds (or refresh click): **`POST /api/suggestions`** → Groq **GPT‑OSS 120B** → returns 3 cards  
5. Clicking a card triggers **`POST /api/chat`** (SSE) → streaming detailed answer in right panel  

### Frontend entry points

- API calls live in `frontend/src/utils/api.js`
- Hook orchestration:
  - `useTranscript` → `/api/transcribe`
  - `useSuggestions` → `/api/suggestions`
  - `useChat` → `/api/chat` (SSE)

### Backend routes

- `POST /api/transcribe` → Groq Whisper (`whisper-large-v3`)
- `POST /api/suggestions` → Groq Chat (`openai/gpt-oss-120b`) → returns 3 suggestion cards
- `POST /api/chat` → Groq Chat streaming (SSE)
- `GET /api/settings/defaults` → returns default prompts/models/context windows

## Tech Stack

- **Frontend**: React 18, Vite 5, plain CSS (no Tailwind, no component libs)
- **Backend**: Node.js 18+, Express, axios, multer, form-data
- **Models (Groq)**:
  - Transcription: `whisper-large-v3`
  - Suggestions & Chat: `openai/gpt-oss-120b`

## Local Development

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001` by default.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### API proxy (dev)

`frontend/vite.config.js` proxies `/api/*` to the backend so there are no CORS headaches during development.

## Configuration / Settings

In the UI, open **Settings**:

- **Groq API Key**: stored only in `localStorage` (never committed)
- **Suggestion prompt** and **Chat prompt**: editable
- **Context lines**: configurable; frontend converts “lines” → “characters” for the backend context window

The frontend sends the API key in both headers for compatibility:
- `Authorization: Bearer <key>` (used by this backend)
- `x-groq-api-key: <key>` (harmless extra header; helps if you swap backends later)

## Deployment (recommended)

You’ll typically deploy **frontend** and **backend** separately.

### Option A — Vercel (frontend) + Render (backend)

**Backend (Render)**
- Create a new Web Service
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Set env vars:
  - `NODE_ENV=production`
  - `PORT=3001` (Render may override; that’s fine)
  - `CORS_ORIGIN=<your vercel domain>`

**Frontend (Vercel)**
- New Project → root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set env var (optional): none needed
- Update `frontend/src/utils/api.js` if you want to hit a deployed backend domain (otherwise keep proxy for local dev).

### Option B — Single host (advanced)

You can also serve the Vite build from Express, but this repo is intentionally split to keep the evaluation surface clear.

## Recruiter Notes / What to look for

- Prompting and context control for **3 high-signal suggestions**
- Low-latency streaming chat UX via SSE
- Clean separation: hooks → `utils/api.js` → backend routes
- Exportable session data for evaluation

