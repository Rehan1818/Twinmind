const TYPE_CLASS = {
  answer: "badge-green",
  fact_check: "badge-orange",
  talking_point: "badge-blue",
  question: "badge-purple",
  clarify: "badge-teal",
};

function SuggestionCard({ suggestion, onClick }) {
  const type = suggestion?.type || "talking_point";
  const badgeClass = TYPE_CLASS[type] || "badge-blue";

  return (
    <button type="button" className="suggestion-card" onClick={() => onClick(suggestion)}>
      <span className={`type-badge ${badgeClass}`}>{type.replace("_", " ")}</span>
      <p className="suggestion-preview">{suggestion?.preview}</p>
    </button>
  );
}

export default SuggestionCard;
