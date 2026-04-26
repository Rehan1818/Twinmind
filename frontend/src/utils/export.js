export function exportSession({ transcript, suggestionBatches, messages }) {
  const payload = {
    exported_at: new Date().toISOString(),
    transcript,
    suggestions: suggestionBatches,
    chat: messages,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `twinmind-session-${Date.now()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
