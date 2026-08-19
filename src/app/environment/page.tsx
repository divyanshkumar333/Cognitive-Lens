"use client";

import { useEffect, useRef, useState } from "react";
import { scoreFrame, type EnvironmentScore } from "@/lib/environment/scoring";
import { useEnvironment } from "@/hooks/useEnvironment";

const SAMPLE_INTERVAL_MS = 400;

const SAMPLE_TASK = {
  title: "Reading: Cellular Respiration",
  essential:
    "Cellular respiration breaks down glucose using oxygen to release usable energy as ATP.",
  sentences: [
    "Cellular respiration is the process by which cells break down glucose in the presence of oxygen to release usable energy in the form of ATP.",
    "This process occurs in three main stages: glycolysis, the Krebs cycle, and the electron transport chain.",
    "Each stage transfers energy through a series of chemical reactions.",
    "The process ultimately produces water and carbon dioxide as byproducts.",
  ],
};

const modeReasons: Record<EnvironmentScore["recommendedMode"], string> = {
  normal: "Standard reading view",
  "high-contrast": "Simplified for glare",
  calm: "Slowed down for low light",
  focus: "Broken into steps for a busy space",
  noisy: "Narrowed to one line for a loud space",
};

interface ModeConfig {
  bg: string;
  text: string;
  accent: string;
  label: string;
  fontSize: string;
  lineHeight: string;
  maxWidth: string;
  letterSpacing: string;
  layout: "paragraph" | "essential" | "lines" | "slow" | "noisy";
}

const modeStyles: Record<EnvironmentScore["recommendedMode"], ModeConfig> = {
  normal: {
    bg: "bg-neutral-50",
    text: "text-neutral-800",
    accent: "#d97706",
    label: "Normal",
    fontSize: "text-lg",
    lineHeight: "leading-relaxed",
    maxWidth: "max-w-xl",
    letterSpacing: "tracking-normal",
    layout: "paragraph",
  },
  "high-contrast": {
    bg: "bg-black",
    text: "text-white",
    accent: "#facc15",
    label: "High Contrast",
    fontSize: "text-2xl",
    lineHeight: "leading-loose",
    maxWidth: "max-w-lg",
    letterSpacing: "tracking-wide",
    layout: "essential",
  },
  calm: {
    bg: "bg-slate-900",
    text: "text-slate-50",
    accent: "#94a3b8",
    label: "Calm / Brightened",
    fontSize: "text-lg",
    lineHeight: "leading-loose",
    maxWidth: "max-w-xl",
    letterSpacing: "tracking-normal",
    layout: "slow",
  },
  noisy: {
    bg: "bg-indigo-950",
    text: "text-white",
    accent: "#818cf8",
    label: "Noisy",
    fontSize: "text-3xl",
    lineHeight: "leading-relaxed",
    maxWidth: "max-w-lg",
    letterSpacing: "tracking-normal",
    layout: "noisy",
  },
  focus: {
    bg: "bg-amber-50",
    text: "text-neutral-900",
    accent: "#b45309",
    label: "Focus Mode",
    fontSize: "text-xl",
    lineHeight: "leading-relaxed",
    maxWidth: "max-w-md",
    letterSpacing: "tracking-normal",
    layout: "lines",
  },
};

export default function EnvironmentPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<EnvironmentScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const prevMode = useRef<string | null>(null);

  const noiseState = useEnvironment();
  const noiseRef = useRef(0);
  noiseRef.current = noiseState.noiseLevel;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }

        intervalId = setInterval(() => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.videoWidth === 0) return;

          const w = 160;
          const h = Math.round((video.videoHeight / video.videoWidth) * w);
          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, w, h);
          const frame = ctx.getImageData(0, 0, w, h);
          const result = scoreFrame(frame.data, w, h, noiseRef.current);

          setScore(result);
        }, SAMPLE_INTERVAL_MS);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not access camera. Check browser permissions."
        );
      }
    }

    start();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!score) return;
    if (prevMode.current === null) {
      prevMode.current = score.recommendedMode;
      return;
    }
    if (prevMode.current !== score.recommendedMode) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 220);
      prevMode.current = score.recommendedMode;
      return () => clearTimeout(t);
    }
  }, [score?.recommendedMode]);

  const mode = modeStyles[score?.recommendedMode ?? "normal"];
  const reason = modeReasons[score?.recommendedMode ?? "normal"];

  function renderContent() {
    if (mode.layout === "essential") {
      return (
        <p
          className={`font-medium ${mode.fontSize} ${mode.lineHeight} ${mode.letterSpacing}`}
        >
          {SAMPLE_TASK.essential}
        </p>
      );
    }

    if (mode.layout === "lines") {
      return (
        <div className="space-y-4">
          {SAMPLE_TASK.sentences.map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div
                className="mt-1 h-6 w-6 shrink-0 rounded-full border flex items-center justify-center text-xs"
                style={{ borderColor: mode.accent }}
              >
                {i + 1}
              </div>
              <p
                className={`${mode.fontSize} ${mode.lineHeight} ${mode.letterSpacing}`}
              >
                {s}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (mode.layout === "noisy") {
      const idx =
        Math.floor(Date.now() / 2500) % SAMPLE_TASK.sentences.length;
      return (
        <p
          className={`font-semibold text-center ${mode.fontSize} ${mode.lineHeight}`}
        >
          {SAMPLE_TASK.sentences[idx]}
        </p>
      );
    }

    if (mode.layout === "slow") {
      return (
        <div className="space-y-5">
          {SAMPLE_TASK.sentences.map((s, i) => (
            <p
              key={i}
              className={`${mode.fontSize} ${mode.lineHeight} ${mode.letterSpacing} transition-opacity duration-1000`}
              style={{
                opacity: 1,
                transitionDelay: `${i * 300}ms`,
              }}
            >
              {s}
            </p>
          ))}
        </div>
      );
    }

    return (
      <p className={`${mode.fontSize} ${mode.lineHeight} ${mode.letterSpacing}`}>
        {SAMPLE_TASK.sentences.join(" ")}
      </p>
    );
  }

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center gap-10 p-8 transition-all duration-500 ${mode.bg} ${mode.text}`}
    >
      <div
        className={`fixed inset-0 pointer-events-none bg-white transition-opacity duration-200 ${
          flash ? "opacity-30" : "opacity-0"
        }`}
      />

      <div className="hidden bg-neutral-50 bg-black bg-slate-900 bg-amber-50 bg-indigo-950 text-neutral-800 text-white text-slate-50 text-neutral-900 text-lg text-xl text-2xl text-3xl leading-relaxed leading-loose max-w-xl max-w-md max-w-lg tracking-normal tracking-wide" />

      <div className="text-center space-y-1">
        <p className="text-xs uppercase tracking-widest opacity-50">
          Environment Intelligence
        </p>
        <p className="text-sm opacity-70">
          Your workspace, read by the interface
        </p>
      </div>

      {error && (
        <div className="text-red-500 text-sm max-w-md text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-start w-full max-w-4xl justify-center">
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10 shrink-0">
          <video
            ref={videoRef}
            className="w-[320px] h-[240px] object-cover bg-neutral-900"
            muted
            playsInline
          />
          <div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-md transition-colors duration-300"
            style={{ backgroundColor: mode.accent }}
          >
            {mode.label}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-8 transition-all duration-500 ${mode.maxWidth}`}
          style={{ borderColor: mode.accent + "40" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wide opacity-50">
              {SAMPLE_TASK.title}
            </h2>
            <span
              className="text-[10px] px-2 py-1 rounded-full border opacity-70"
              style={{ borderColor: mode.accent }}
            >
              {reason}
            </span>
          </div>
          {renderContent()}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {score && (
        <div
          className="max-w-lg text-center px-5 py-3 rounded-xl border transition-all duration-500"
          style={{ borderColor: mode.accent + "60" }}
        >
          <p className="text-sm font-medium">{score.narration}</p>
        </div>
      )}

      {score && (
        <div className="flex gap-8 text-center opacity-70">
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {score.brightness}
            </div>
            <div className="text-xs uppercase tracking-wide">Brightness</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {score.glare}%
            </div>
            <div className="text-xs uppercase tracking-wide">Glare</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {score.clutter}
            </div>
            <div className="text-xs uppercase tracking-wide">Clutter</div>
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums">
              {score.noise}
            </div>
            <div className="text-xs uppercase tracking-wide">Noise</div>
          </div>
        </div>
      )}

      {!ready && !error && (
        <p className="opacity-50 text-sm">Requesting camera access...</p>
      )}
    </main>
  );
}


