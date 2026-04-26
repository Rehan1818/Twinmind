import { useCallback, useEffect, useRef, useState } from "react";

const CHUNK_MS = 25_000;

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const rotateTimerRef = useRef(null);
  const shouldContinueRef = useRef(false);

  const clearRotateTimer = useCallback(() => {
    if (rotateTimerRef.current) {
      window.clearTimeout(rotateTimerRef.current);
      rotateTimerRef.current = null;
    }
  }, []);

  const scheduleRotate = useCallback(() => {
    clearRotateTimer();
    rotateTimerRef.current = window.setTimeout(() => {
      const recorder = mediaRecorderRef.current;
      if (!shouldContinueRef.current || !recorder || recorder.state === "inactive") return;
      recorder.stop();
    }, CHUNK_MS);
  }, [clearRotateTimer]);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    shouldContinueRef.current = false;
    clearRotateTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    stopTracks();
    setIsRecording(false);
  }, [clearRotateTimer, stopTracks]);

  const startRecording = useCallback(async (onChunk) => {
    if (isRecording) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    shouldContinueRef.current = true;
    setIsRecording(true);

    const startChunkRecorder = () => {
      if (!shouldContinueRef.current || !streamRef.current) return;

      let recorder;
      try {
        recorder = new MediaRecorder(streamRef.current, {
          mimeType: "audio/webm;codecs=opus",
        });
      } catch {
        recorder = new MediaRecorder(streamRef.current);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0 && typeof onChunk === "function") {
          onChunk(event.data);
        }
      };

      recorder.onstop = () => {
        if (shouldContinueRef.current) {
          startChunkRecorder();
          return;
        }
        mediaRecorderRef.current = null;
        stopTracks();
        setIsRecording(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      scheduleRotate();
    };

    startChunkRecorder();
  }, [isRecording, scheduleRotate, stopTracks]);

  useEffect(() => () => stopRecording(), [stopRecording]);

  return { isRecording, startRecording, stopRecording };
}
