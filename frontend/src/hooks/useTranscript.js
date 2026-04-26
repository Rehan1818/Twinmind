import { useCallback, useRef, useState } from "react";
import { useAudioRecorder } from "./useAudioRecorder.js";
import { transcribeAudio } from "../utils/api.js";

export function useTranscript({ apiKey, onError }) {
  const [lines, setLines] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { isRecording, startRecording: startRecorder, stopRecording } = useAudioRecorder();
  const processingChainRef = useRef(Promise.resolve());
  const pendingCountRef = useRef(0);

  const handleChunk = useCallback((blob) => {
    if (!apiKey) return;

    pendingCountRef.current += 1;
    setIsTranscribing(true);

    processingChainRef.current = processingChainRef.current
      .catch(() => {})
      .then(async () => {
        try {
          const data = await transcribeAudio(blob, apiKey);
          const text = (data?.text || "").trim();
          if (text) {
            setLines((prev) => [...prev, text]);
          }
        } catch (error) {
          if (typeof onError === "function") {
            onError("Transcription failed, retrying...");
          }
        } finally {
          pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
          if (pendingCountRef.current === 0) {
            setIsTranscribing(false);
          }
        }
      });
  }, [apiKey, onError]);

  const startRecording = useCallback(async () => {
    await startRecorder(handleChunk);
  }, [handleChunk, startRecorder]);

  return {
    lines,
    isRecording,
    startRecording,
    stopRecording,
    isTranscribing,
  };
}
