import { useEffect, useRef } from "react";

function TranscriptPanel({ lines, isRecording, isTranscribing, onStart, onStop }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-label">TRANSCRIPT</span>
        <span className={`panel-badge ${isRecording ? "badge-recording" : "badge-idle"}`}>
          {isRecording ? "RECORDING" : "IDLE"}
        </span>
      </div>

      <div className="mic-area">
        <button
          type="button"
          className={`mic-button ${isRecording ? "recording" : ""}`}
          onClick={isRecording ? onStop : onStart}
          title={isRecording ? "Stop recording" : "Start recording"}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <svg viewBox="0 0 24 24" className="mic-icon" aria-hidden="true">
            <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
            <path d="M17 11a1 1 0 1 1 2 0 7 7 0 1 1-14 0 1 1 0 1 1 2 0 5 5 0 1 0 10 0Z" />
            <path d="M11 19h2v3h-2z" />
            <path d="M8 22a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2z" />
          </svg>
        </button>
        <p className="mic-hint">
          {isRecording
            ? "Recording… click to stop."
            : "Click mic to start. Transcript appends every ~30s."}
        </p>
      </div>


      {isTranscribing && <p className="status">Transcribing…</p>}

      <div className="scroll-area" ref={listRef}>
        {lines.length === 0 ? (
          <p className="empty-state">No transcript yet — start the mic.</p>
        ) : (
          lines.map((line, index) => (
            <p key={`${index}-${line.slice(0, 20)}`} className="transcript-line fade-in">
              {line}
            </p>
          ))
        )}
      </div>
    </section>
  );
}

export default TranscriptPanel;