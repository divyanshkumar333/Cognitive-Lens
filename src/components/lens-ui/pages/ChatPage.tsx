"use client";

import { useState, useRef, useEffect } from "react";
import type { PageId } from "../App";
import { useMode } from "@/context/ModeContext";

type Msg = { from: "user" | "lens"; text: string };
type ChatHistoryItem = { role: "user" | "assistant"; content: string };

const initialMessages: Msg[] = [
  { from: "lens", text: "Hey. What's on your mind?" },
];

export default function ChatPage({
  onNavigate,
  onAnalysis,
  onFirstReply,
}: {
  onNavigate: (p: PageId) => void;
  onAnalysis?: (a: any) => void;
  onFirstReply?: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mode, noiseLevel, micGranted, demoNoise, setDemoNoise } = useMode();

  const effectiveNoise = demoNoise ?? noiseLevel;
  const effectiveMode: "calm" | "focused" | "overwhelmed" =
    demoNoise !== null
      ? demoNoise > 60
        ? "overwhelmed"
        : demoNoise > 30
        ? "focused"
        : "calm"
      : mode;

  const dotColor =
    effectiveMode === "overwhelmed" ? "bg-[#E8A698]" : effectiveMode === "focused" ? "bg-[#E0A458]" : "bg-[#5A6B52]";
  const pillLabel = effectiveMode === "overwhelmed" ? "adapting" : effectiveMode === "focused" ? "focused" : "calm";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendText = async (text: string) => {
    if (!text || loading) return;

    
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          environmentScore: {
            noiseLevel: effectiveNoise,
            micGranted: demoNoise !== null ? true : micGranted,
          },
        }),
      });
      const data = await res.json();

      if (data.needsClarification && data.clarifyingQuestion) {
        setMessages((m) => [...m, { from: "lens", text: data.clarifyingQuestion }]);
        onFirstReply?.();
      } else if (data.route === "chat" && data.reply) {
        setMessages((m) => [...m, { from: "lens", text: data.reply }]);
        setHistory((h) => [
          ...h,
          { role: "user", content: text },
          { role: "assistant", content: data.reply },
        ]);
        onFirstReply?.();
      } else if (data.task || data.decision) {
        console.log("ANALYSIS RESPONSE:", data);
        onAnalysis?.(data);
        onFirstReply?.();
      } else if (data.error) {
        setMessages((m) => [...m, { from: "lens", text: "Something went wrong. Try again?" }]);
      }
    } catch {
      setMessages((m) => [...m, { from: "lens", text: "Could not reach the server." }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendText(text);
  };

  const handleFile = async (file: File) => {
    const name = file.name.toLowerCase();
    setUploading(true);
    setMessages((m) => [...m, { from: "user", text: `uploaded: ${file.name}` }]);

    try {
      if (name.endsWith(".txt")) {
        const text = await file.text();
        setUploading(false);
        await sendText(text);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-document", { method: "POST", body: formData });
      const data = await res.json();

      setUploading(false);

      if (data.error) {
        setMessages((m) => [...m, { from: "lens", text: data.error }]);
        return;
      }

      await sendText(data.text);
    } catch {
      setUploading(false);
      setMessages((m) => [...m, { from: "lens", text: "Could not read that file. Try again?" }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-h-[860px]">
      <header className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-[32px] text-[#2B2F2A] tracking-tight leading-none">
          Conversation
        </h1>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 bg-white/70 border transition-all duration-300 ${
              effectiveMode === "overwhelmed" ? "border-[#E8A698] shadow-[0_0_0_3px_rgba(232,166,152,0.25)]" : "border-white/80"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${dotColor} ${effectiveMode === "overwhelmed" ? "pulse-fast" : "pulse-dot"}`} />
            <span className="text-[11px] text-[#5A6B52] font-medium">{pillLabel}</span>
          </div>
          <select
            value={demoNoise === null ? "live" : String(demoNoise)}
            onChange={(e) => {
              const v = e.target.value;
              setDemoNoise(v === "live" ? null : Number(v));
            }}
            className="text-[10px] rounded-full bg-white/50 border border-white/80 px-2 py-1 text-[#8A7E72] focus:outline-none"
          >
            <option value="live">live mic</option>
            <option value="10">calm</option>
            <option value="45">focused</option>
            <option value="80">overwhelmed</option>
          </select>
        </div>
      </header>

      <div
        className={`flex-1 overflow-y-auto pr-2 -mr-2 pb-4 transition-all duration-300 ${
          effectiveMode === "overwhelmed" ? "space-y-2" : "space-y-5"
        }`}
        ref={scrollRef}
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex rise ${m.from === "user" ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${i * 60}ms` }}>
            <div
              className={`max-w-[72%] leading-relaxed transition-all duration-300 ${
                effectiveMode === "overwhelmed" ? "px-4 py-2.5 text-[13.5px]" : "px-5 py-3.5 text-[14.5px]"
              } ${
                m.from === "user"
                  ? "bg-[#3F4A3A] text-[#FBE9DE] rounded-[22px] rounded-br-md"
                  : "bg-white/85 text-[#2B2F2A] rounded-[22px] rounded-bl-md border border-white"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {(loading || uploading) && (
          <div className="flex justify-start">
            <div className="max-w-[72%] px-5 py-3.5 text-[14.5px] bg-white/85 text-[#8A7E72] rounded-[22px] rounded-bl-md border border-white">
              {uploading ? "reading file..." : "thinking..."}
            </div>
          </div>
        )}
      </div>

      <div
        className={`mt-4 rounded-full bg-white/85 border shadow-[0_4px_24px_-12px_rgba(160,110,90,0.3)] p-1.5 flex items-center gap-2 transition-all duration-300 ${
          effectiveMode === "overwhelmed" ? "border-[#E8A698]" : "border-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || uploading}
          title="upload a file"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[#8A7E72] hover:bg-white/60 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={effectiveMode === "overwhelmed" ? "just say the one thing..." : "say something..."}
          disabled={loading || uploading}
          className="flex-1 bg-transparent px-2 py-2 text-[14px] text-[#2B2F2A] placeholder:text-[#B7A99C] focus:outline-none"
        />
        <button
          onClick={send}
          disabled={loading || uploading}
          className="rounded-full bg-[#3F4A3A] text-[#FBE9DE] px-5 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
        >
          send
        </button>
      </div>
    </div>
  );
}