"use client";

import { useEffect, useRef, useState } from "react";

export interface CameraEnvironment {
  brightness: number;
  clutterScore: number;
  cameraGranted: boolean;
}

export function useCameraEnvironment() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [state, setState] = useState<CameraEnvironment>({
    brightness: 0.5,
    clutterScore: 0.5,
    cameraGranted: false,
  });

  useEffect(() => {
    let stream: MediaStream;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const video = document.createElement("video");

        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;

        await video.play();

        videoRef.current = video;

        setState((prev) => ({
          ...prev,
          cameraGranted: true,
        }));

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        function analyze() {
          if (!ctx || !video.videoWidth) {
            requestAnimationFrame(analyze);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.drawImage(video, 0, 0);

          const pixels = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          ).data;

          let total = 0;

          for (let i = 0; i < pixels.length; i += 4) {
            total += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          }

          const brightness = total / (pixels.length / 4) / 255;

          setState((prev) => ({
            ...prev,
            brightness,
            clutterScore: 0.5,
          }));

          requestAnimationFrame(analyze);
        }

        analyze();
      } catch {
        setState((prev) => ({
          ...prev,
          cameraGranted: false,
        }));
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return state;
}
