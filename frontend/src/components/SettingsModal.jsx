import { useEffect, useRef, useState } from "react";

function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [draft, setDraft] = useState(settings);
  const [apiKeyFieldKey, setApiKeyFieldKey] = useState(0);
  const apiKeyInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setApiKeyFieldKey((k) => k + 1);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const update = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    const fromDom = apiKeyInputRef.current?.value;
    const apiKeyRaw =
      typeof fromDom === "string" && fromDom.trim()
        ? fromDom
        : typeof draft.apiKey === "string"
          ? draft.apiKey
          : "";
    const apiKey = String(apiKeyRaw).trim();

    const next = {
      ...draft,
      apiKey,
      suggestionContextLines: Number(draft.suggestionContextLines) || 30,
      chatContextLines: Number(draft.chatContextLines) || 80,
    };
    localStorage.setItem("twinmind-settings", JSON.stringify(next));
    onSave(next);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h3>Settings</h3>
        <label>
          Groq API Key
          <input
            key={apiKeyFieldKey}
            ref={apiKeyInputRef}
            type="password"
            autoComplete="off"
            defaultValue={settings.apiKey ?? ""}
            onChange={(event) => update("apiKey", event.target.value)}
            onInput={(event) => update("apiKey", event.target.value)}
            placeholder="gsk_..."
          />
        </label>
        <label>
          Suggestion system prompt
          <textarea
            value={draft.suggestionPrompt}
            onChange={(event) => update("suggestionPrompt", event.target.value)}
            rows={6}
          />
        </label>
        <label>
          Chat system prompt
          <textarea
            value={draft.chatPrompt}
            onChange={(event) => update("chatPrompt", event.target.value)}
            rows={6}
          />
        </label>
        <label>
          Suggestion context lines
          <input
            type="number"
            value={draft.suggestionContextLines}
            onChange={(event) => update("suggestionContextLines", event.target.value)}
          />
        </label>
        <label>
          Chat context lines
          <input
            type="number"
            value={draft.chatContextLines}
            onChange={(event) => update("chatContextLines", event.target.value)}
          />
        </label>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
