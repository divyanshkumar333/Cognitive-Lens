"use client";

import { useState, useRef, useEffect } from "react";
import { AnalysisResult } from "@/types/analysis";
import { useEnvironment } from "@/hooks/useEnvironment";
import { scoreFrame, type EnvironmentScore } from "@/lib/environment/scoring";
import { ResultCard } from "./ResultCard";
import { OverwhelmedOverlay } from "./OverwhelmedOverlay";
import { GapWalkthrough } from "./GapWalkthrough";

interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  result?: AnalysisResult;
  gapNodes?: { concept: string; reason: string }[];
  topic?: string;
}

function CognitiveScan() {
  const [checks, setChecks] = useState<string[]>([]);
  const steps = [
    "Hidden structure",
    "Cognitive friction",
    "Missing prerequisites",
    "Decision overload",
  ];

  useEffect(() => {
    setChecks([]);
    const timers = steps.map((step, i) =>
      setTimeout(
        () => {
          setChecks((prev) => [...prev, step]);
        },
        450 * (i + 1),
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="cl-glass"
      style={{ padding: "1.5rem", width: "fit-content", minWidth: 260 }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--cl-green)",
          opacity: 0.7,
          marginBottom: 12,
        }}
      >
        Scanning your task...
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((step) => {
          const done = checks.includes(step);
          return (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: done ? "var(--cl-text)" : "var(--cl-green)",
                opacity: done ? 1 : 0.35,
                transition: "opacity 0.4s ease",
              }}
            >
              <span
                style={{
                  color: done ? "var(--cl-green)" : "transparent",
                  width: 14,
                }}
              >
                ?
              </span>
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Workspace() {
  const [envState, setEnvState] = useState("calm");
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawAnalysis, setRawAnalysis] = useState<unknown | null>(null);

  const [pendingClarification, setPendingClarification] = useState<
    string | null
  >(null);

  const environment = useEnvironment();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestScoreRef = useRef<EnvironmentScore | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [envDotColor, setEnvDotColor] = useState<"sage" | "amber" | "dusty">(
    "dusty",
  );
  const [envBars, setEnvBars] = useState({
    clutter: 0,
    lighting: 0.5,
    noise: 0,
  });
  const latestGeminiCheckRef = useRef<{
    visibleClutterItems: number;
    lightingQuality: string;
    confidence: number;
    note: string;
  } | null>(null);
  const geminiTickRef = useRef(0);
  const geminiInFlightRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
          const score = scoreFrame(frame.data, w, h, 0);
          latestScoreRef.current = score;

          const clutterLevel =
            (score as any)?.clutter ?? (score as any)?.clutterScore;
          const brightnessLevel =
            (score as any)?.brightness ??
            (score as any)?.brightnessScore ??
            0.5;
          if (typeof clutterLevel === "number") {
            setEnvDotColor(clutterLevel > 0.6 ? "amber" : "sage");
            setEnvBars({
              clutter: clutterLevel,
              lighting: brightnessLevel,
              noise: environment.noiseLevel ?? 0,
            });
          }

          geminiTickRef.current += 1;
          if (geminiTickRef.current >= 999999 && !geminiInFlightRef.current) {
            geminiTickRef.current = 0;
            geminiInFlightRef.current = true;

            const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.6);
            const base64Jpeg = jpegDataUrl.split(",")[1];

            fetch("/api/environment-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ frame: base64Jpeg }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data?.check) {
                  latestGeminiCheckRef.current = {
                    visibleClutterItems: data.check.visibleClutterItems,
                    lightingQuality: data.check.lightingQuality,
                    confidence: data.check.confidence,
                    note: data.check.note,
                  };
                }
              })
              .catch((err) => {
                console.error("Gemini environment check request failed:", err);
              })
              .finally(() => {
                geminiInFlightRef.current = false;
              });
          }
        }, 400);
      } catch (err) {
        console.error(
          "Camera unavailable, proceeding without environment context:",
          err,
        );
        setEnvDotColor("dusty");
      }
    }

    start();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const fetchExplanation = async (
    concept: string,
    reason: string,
    topic: string,
  ): Promise<string> => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Explain "${concept}" in the context of ${topic}. Context: ${reason}. Keep it clear, concrete, and a few sentences - this is a specific concept explanation for someone actively learning, not a general chat reply.`,
        history: [],
        resultContext: null,
      }),
    });
    const data = await response.json();
    return data.reply ?? `Here's the idea behind ${concept}: ${reason}.`;
  };

  const mapAnalysisToResult = (data: any): AnalysisResult => ({
    score: 20,
    diagnosis: data.explanation?.summary ?? "Your task has been analyzed.",
    summary: data.explanation?.summary ?? "",
    firstStep: data.decision?.firstAction ?? "Start with the first action.",
    firstAction: data.decision?.firstAction ?? "Start with the first action.",
    roadmap: (data.decision?.roadmap ?? []).map((step: string) => ({
      label: step,
      sub: "AI-generated micro step",
      duration: "Start now",
    })),
    concepts: (data.structure?.concepts ?? []).map(
      (label: string, i: number) => ({
        id: `concept-${i}-${label}`,
        label,
        kind: "idea",
      }),
    ),
    edges: (data.dependencies?.edges ?? []).map(
      (e: { from: string; to: string; relation: string }) => ({
        from: e.from,
        to: e.to,
        relation: e.relation,
      }),
    ),
    environment: data.environment ?? null,
    emotion: null,
  });

  const runFullAnalysis = async (text: string, skipClarification = false) => {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        skipClarification,
        environmentScore: latestScoreRef.current,
        geminiCheck: latestGeminiCheckRef.current,
        environment: {
          noiseLevel: environment.noiseLevel,
          microphoneGranted: environment.microphoneGranted,
        },
      }),
    });
    return await response.json();
  };

  const processText = async (text: string) => {
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      if (pendingClarification) {
        const combined = `${pendingClarification}\n\nAdditional detail: ${text}`;
        setPendingClarification(null);

        const analysis = await runFullAnalysis(combined, true);
        setRawAnalysis(analysis);
        const result = mapAnalysisToResult(analysis);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Here's your breakdown:", result },
        ]);

        const gapNodes = analysis.dependencies?.gapNodes ?? [];
        if (gapNodes.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "__GAP_WALKTHROUGH__",
              gapNodes,
              topic: combined,
            },
          ]);
        }
        return;
      }

      const chatHistoryForApi = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistoryForApi,
          resultContext: rawAnalysis,
          environmentScore: latestScoreRef.current,
        }),
      });

      const data = await response.json();

      if (data.needsClarification !== undefined) {
        const analysis = data;

        if (analysis.needsClarification) {
          setPendingClarification(text);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: analysis.clarifyingQuestion },
          ]);
          return;
        }

        setRawAnalysis(analysis);
        const result = mapAnalysisToResult(analysis);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Here's your breakdown:", result },
        ]);

        const gapNodes = analysis.dependencies?.gapNodes ?? [];
        if (gapNodes.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "__GAP_WALKTHROUGH__",
              gapNodes,
              topic: text,
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply ?? "Sorry, something went wrong.",
          },
        ]);
      }
    } catch (error) {
      console.error("Message failed:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await processText(text);
  };

  const handleMicClick = () => {
    if (loading) return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Voice input isn't supported in this browser.",
        },
      ]);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleFileButtonClick = () => {
    if (loading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const name = file.name.toLowerCase();
    const isTxt = name.endsWith(".txt");
    const isPdf = name.endsWith(".pdf");
    const isImage =
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp");

    if (!isTxt && !isPdf && !isImage) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Only .txt, .pdf, .png, .jpg, or .jpeg files are supported.",
        },
      ]);
      return;
    }

    if (isTxt) {
      try {
        const text = await file.text();
        const trimmed = text.trim();
        if (!trimmed) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "That file looks empty." },
          ]);
          return;
        }
        await processText(trimmed);
      } catch (err) {
        console.error("File read failed:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Couldn't read that file. Try again." },
        ]);
      }
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: isPdf ? "Reading your PDF..." : "Reading your image...",
      },
    ]);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-document", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.text) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error ?? "Couldn't read that file. Try again.",
          },
        ]);
        setLoading(false);
        return;
      }

      setLoading(false);
      await processText(data.text);
    } catch (err) {
      console.error("Document parse request failed:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Couldn't read that file. Try again." },
      ]);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setRawAnalysis(null);
    setInput("");
    setPendingClarification(null);
  };

  const envDotStyles = {
    sage: { bg: "var(--cl-green)", label: "Calm workspace" },
    amber: { bg: "var(--cl-amber)", label: "A bit cluttered" },
    dusty: { bg: "#8FA8B8", label: "Reading your space..." },
  }[envDotColor];

  const isCluttered = envBars.clutter > 0.6;

  return (
    <div className="cl-canvas" data-env={isCluttered ? "cluttered" : "calm"}>
      <header
        style={{
          margin: "0 auto",
          maxWidth: 768,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2rem 1.5rem 1rem",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--cl-text)" }}>
          Cognitive Lens
        </h1>

        <div
          className="cl-glass"
          title={envDotStyles.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
          }}
        >
          <span
            style={{
              display: "inline-block",
              height: 10,
              width: 10,
              borderRadius: "50%",
              backgroundColor: envDotStyles.bg,
            }}
          />
          <span
            style={{ fontSize: 11, fontWeight: 500, color: "var(--cl-green)" }}
          >
            {envDotStyles.label}
          </span>
        </div>
      </header>

      <div
        className="cl-env-strip"
        data-env={isCluttered ? "cluttered" : "calm"}
      >
        {[
          { label: "Lighting", value: envBars.lighting },
          { label: "Clutter", value: envBars.clutter },
          { label: "Noise", value: envBars.noise },
        ].map((bar) => (
          <div
            key={bar.label}
            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
          >
            <span
              style={{
                fontSize: 10,
                color: "var(--cl-green)",
                opacity: 0.7,
                minWidth: 52,
              }}
            >
              {bar.label}
            </span>
            <div className="cl-env-bar-track">
              <div
                className="cl-env-bar-fill"
                style={{
                  width: `${Math.round(bar.value * 100)}%`,
                  background:
                    bar.value > 0.6 ? "var(--cl-amber)" : "var(--cl-green)",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <main
        style={{ margin: "0 auto", maxWidth: 768, padding: "0 1.5rem 10rem" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "6rem 1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  height: 10,
                  width: 10,
                  borderRadius: "50%",
                  background: "var(--cl-rose)",
                }}
              />
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: "var(--cl-text)",
                }}
              >
                Good afternoon. Let&apos;s make this easier.
              </p>
              <p
                style={{
                  maxWidth: 320,
                  fontSize: 14,
                  color: "var(--cl-green)",
                }}
              >
                A task, a brain dump, or just say hey.
              </p>
            </div>
          )}

          {messages.map((entry, i) => (
            <div key={i}>
              {entry.content === "__GAP_WALKTHROUGH__" && entry.gapNodes ? (
                <GapWalkthrough
                  gapNodes={entry.gapNodes}
                  topic={entry.topic ?? ""}
                  onFetchExplanation={fetchExplanation}
                  onComplete={() => {
                    setInput(
                      `Write the report on ${entry.topic} based on what we've discussed.`,
                    );
                  }}
                />
              ) : entry.result ? (
                <ResultCard result={entry.result} onReset={handleReset} />
              ) : (
                <div
                  className={entry.role === "assistant" ? "cl-glass" : ""}
                  style={{
                    maxWidth: "80%",
                    padding: "10px 16px",
                    fontSize: 14,
                    borderRadius: 16,
                    marginLeft: entry.role === "user" ? "auto" : undefined,
                    background:
                      entry.role === "user" ? "var(--cl-green)" : undefined,
                    color: entry.role === "user" ? "#fff" : "var(--cl-text)",
                  }}
                >
                  {entry.content}
                </div>
              )}
            </div>
          ))}

          {loading && <CognitiveScan />}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div
        style={{
          position: "fixed",
          insetInline: 0,
          bottom: 0,
          background: "rgba(255,246,241,0.9)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            margin: "0 auto",
            maxWidth: 768,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "1rem 1.5rem",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder={
              pendingClarification
                ? "Answer the question above..."
                : "Type a task, a brain dump, or say hey..."
            }
            className="cl-glass"
            style={{
              flex: 1,
              border: "none",
              padding: "12px 16px",
              fontSize: 14,
              color: "var(--cl-text)",
              borderRadius: 16,
            }}
          />

          <button
            onClick={handleFileButtonClick}
            disabled={loading}
            title="Upload a .txt, .pdf, or image file"
            className="cl-glass"
            style={{
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--cl-green)",
              borderRadius: 16,
              opacity: loading ? 0.4 : 1,
              cursor: loading ? "default" : "pointer",
              transition: "transform 0.15s ease, background 0.2s ease",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.96)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Upload
          </button>

          <button
            onClick={handleMicClick}
            disabled={loading}
            title={isListening ? "Stop listening" : "Speak instead of typing"}
            className="cl-glass"
            style={{
              padding: "12px 16px",
              fontSize: 15,
              borderRadius: 16,
              opacity: loading ? 0.4 : 1,
              cursor: loading ? "default" : "pointer",
              background: isListening ? "var(--cl-amber)" : undefined,
              color: isListening ? "#fff" : "var(--cl-text)",
              transition: "transform 0.15s ease, background 0.2s ease",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.96)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isListening ? "Stop" : "🎤"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              color: "#fff",
              background: "var(--cl-green)",
              borderRadius: 16,
              border: "none",
              boxShadow: "0 2px 12px rgba(61,79,59,0.25)",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "default" : "pointer",
              transition: "transform 0.15s ease, box-shadow 0.2s ease",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.96)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Send
          </button>
        </div>
      </div>

      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          top: 0,
          left: 0,
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          top: 0,
          left: 0,
        }}
      />

      {envState === "overwhelmed" && (
        <OverwhelmedOverlay onReady={() => setEnvState("focused")} />
      )}
    </div>
  );
}
