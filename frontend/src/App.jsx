import { useMemo, useState } from "react";
import TranscriptPanel from "./components/TranscriptPanel.jsx";
import SuggestionsPanel from "./components/SuggestionsPanel.jsx";
import ChatPanel from "./components/ChatPanel.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { useTranscript } from "./hooks/useTranscript.js";
import { useSuggestions } from "./hooks/useSuggestions.js";
import { useChat } from "./hooks/useChat.js";
import { exportSession } from "./utils/export.js";

const DEFAULT_SETTINGS = {
  apiKey: "",
  suggestionContextLines: 30,
  chatContextLines: 80,
  suggestionPrompt: `You are TwinMind, a real-time meeting and conversation copilot.
Given the latest transcript chunk (and optional prior context), produce exactly 3 high-value suggestion cards for the speaker right now.

Each suggestion must be a different type when the transcript allows it — mix across:
- a sharp follow-up question they could ask
- a concise talking point or framing
- a direct answer to a question someone (possibly the user) just asked
- a quick fact-check or correction if something stated is likely wrong or fuzzy
- a clarification or definition the room might need

Rules:
- Ground every suggestion in the transcript; no generic filler.
- "preview" must stand alone as useful (one tight sentence, max ~220 characters).
- "detail" expands with concrete bullets or short paragraphs (max ~900 characters) — still no fluff.
- If the transcript is thin, still output 3 items but make them genuinely useful (e.g., clarifying questions, ways to steer the conversation).`,
  chatPrompt: `You are TwinMind, a helpful live conversation assistant.
Use the full transcript plus the ongoing chat. Prefer accuracy over confidence; flag uncertainty.
When the user asks something not in the transcript, answer normally but note the gap.`,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem("twinmind-settings");
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function AppInner() {
  const [settings, setSettings] = useState(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState("");

  const apiKey = settings.apiKey;

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__twinmindToastTimer);
    window.__twinmindToastTimer = window.setTimeout(() => setToast(""), 2500);
  };

  const { lines, isRecording, startRecording, stopRecording, isTranscribing } =
    useTranscript({ apiKey, onError: showToast });

  const { batches, isFetching, manualRefresh, error: suggestionsError } = useSuggestions({
    apiKey,
    transcript: lines,
    settings,
  });

  const { messages, sendMessage, isStreaming } = useChat({
    apiKey,
    transcript: lines,
    settings,
  });

  const missingApiKey = useMemo(
    () => !String(settings?.apiKey ?? "").trim(),
    [settings?.apiKey],
  );

  const handleSaveSettings = (next) => {
    setSettings((prev) => ({
      ...prev,
      ...next,
      apiKey: String(next?.apiKey ?? prev?.apiKey ?? "").trim(),
    }));
  };

  const onSuggestionClick = async (suggestion) => {
    if (!suggestion) return;
    await sendMessage(
      `Please expand this clicked suggestion for immediate use in the current meeting.\nType: ${suggestion.type}\nPreview: ${suggestion.preview || ""}\nDetail: ${suggestion.detail || ""}`,
      { mode: "expanded", showInChat: false },
    );
  };

  return (
    <>
      <header className="top-bar">
        <h1>TwinMind Live Suggestions</h1>
        <div className="top-actions">
          <ThemeToggle />
          <button
            type="button"
            onClick={() =>
              exportSession({ transcript: lines, suggestionBatches: batches, messages })
            }
          >
            Export
          </button>
          <button type="button" onClick={() => setIsSettingsOpen(true)}>
            ⚙ Settings
          </button>
        </div>
      </header>

      {missingApiKey && <div className="banner">Add your Groq API key in Settings</div>}
      {toast && <div className="toast">{toast}</div>}

      <main className="app">
        <TranscriptPanel
          lines={lines}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <SuggestionsPanel
          batches={batches}
          isFetching={isFetching}
          onRefresh={manualRefresh}
          onSuggestionClick={onSuggestionClick}
          error={suggestionsError}
        />
        <ChatPanel messages={messages} isStreaming={isStreaming} onSend={sendMessage} />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

export default App;