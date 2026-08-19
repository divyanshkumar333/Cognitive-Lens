import { useEffect, useState } from "react";

export interface EnvironmentState {
  microphoneGranted: boolean;
  cameraGranted: boolean;
  noiseLevel: number;
  brightness: number;
  clutterScore: number;
  status: "idle" | "listening";
}

export function useEnvironment() {
  const [state, setState] = useState<EnvironmentState>({
    microphoneGranted: false,
    cameraGranted: false,
    noiseLevel: 0,
    brightness: 0,
    clutterScore: 0,
    status: "idle",
  });

  useEffect(() => {
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let animationFrame: number;

    async function startListening() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        audioContext = new AudioContext();

        const source = audioContext.createMediaStreamSource(stream);

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        setState((prev) => ({
          ...prev,
          microphoneGranted: true,
          status: "listening",
        }));

        const update = () => {
          analyser.getByteFrequencyData(dataArray);

          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

          setState((prev) => ({
            ...prev,
            noiseLevel: Math.round(average),
          }));

          animationFrame = requestAnimationFrame(update);
        };

        update();
      } catch {
        setState((prev) => ({
          ...prev,
          microphoneGranted: false,
        }));
      }
    }

    startListening();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      audioContext?.close();
    };
  }, []);

  return state;
}
