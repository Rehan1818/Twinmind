import SuggestionCard from "./SuggestionCard.jsx";

function SuggestionsPanel({ batches, isFetching, onRefresh, onSuggestionClick, error }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <span className="panel-label">2. LIVE SUGGESTIONS</span>
        <span className="panel-badge badge-neutral">{batches.length} BATCHES</span>
      </div>

      <div className="suggestions-toolbar">
        <button
          type="button"
          className={`reload-button ${isFetching ? "spin" : ""}`}
          onClick={onRefresh}
        >
          ↺ Reload suggestions
        </button>
        <span className="toolbar-hint">auto-refresh in 30s</span>
      </div>


      {error && <p className="error-text">{error}</p>}

      <div className="scroll-area">
        {batches.length === 0 ? (
          <p className="empty-state">Suggestions appear here once recording starts.</p>
        ) : (
          batches.map((batch, batchIndex) => (
            <div
              key={batch.timestamp}
              className={`suggestion-batch ${batchIndex > 0 ? "batch-faded" : ""}`}
            >
              <p className="batch-time">{new Date(batch.timestamp).toLocaleTimeString()}</p>
              <div className="suggestion-list">
                {batch.suggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={`${batch.timestamp}-${index}`}
                    suggestion={suggestion}
                    onClick={onSuggestionClick}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default SuggestionsPanel;