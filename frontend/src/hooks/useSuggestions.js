import { useCallback, useEffect, useState } from "react";
import { fetchSuggestions } from "../utils/api.js";

export function useSuggestions({ apiKey, transcript, settings }) {
  const [batches, setBatches] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");

  const runFetchSuggestions = useCallback(async () => {
    if (!apiKey || transcript.length === 0 || isFetching) return;

    setIsFetching(true);
    setError("");
    try {
      const contextLines = settings?.suggestionContextLines ?? 30;
      const scopedTranscript = transcript.slice(-contextLines); // array of strings

      const data = await fetchSuggestions(scopedTranscript, settings, apiKey);

      // ✅ FIX — extract suggestions from data, not undefined variable
      const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];

      setBatches((prev) => [
        {
          timestamp: Date.now(),
          suggestions,  // ✅ now correctly defined
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Suggestions error:", err);
      setError("Unable to refresh suggestions right now.");
    } finally {
      setIsFetching(false);
    }
  }, [apiKey, isFetching, settings, transcript]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      runFetchSuggestions();
    }, 30_000);
    return () => clearInterval(timer);
  }, [runFetchSuggestions]);

  const manualRefresh = useCallback(async () => {
    await runFetchSuggestions();
  }, [runFetchSuggestions]);

  return { batches, isFetching, manualRefresh, error };
}