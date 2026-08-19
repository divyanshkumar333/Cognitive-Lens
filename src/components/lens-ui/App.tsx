"use client";

import { useState } from "react";
import ChatPage from "./pages/ChatPage";
import BreakdownPage from "./pages/BreakdownPage";
import SynapticPage from "./pages/SynapticPage";
import ReflectionPage from "./pages/ReflectionPage";
import RemindersPage from "./pages/RemindersPage";
import AmbientBackground from "./AmbientBackground";
import SideNav, { navItems } from "./SideNav";
import MobileNav from "./MobileNav";
import { ModeProvider } from "@/context/ModeContext";
import PetWidget from "./PetWidget";

export type PageId = "chat" | "breakdown" | "synaptic" | "reflection" | "reminders";

export default function App() {
  const [page, setPage] = useState<PageId>("chat");
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [hasChatted, setHasChatted] = useState(false);
  const currentLabel = navItems.find((n) => n.id === page)?.label ?? "";

  const handleNavigate = (p: PageId) => {
    if (p !== "chat" && !hasChatted) return;
    setPage(p);
  };

  return (
    <ModeProvider>
      <div className="relative min-h-screen w-full overflow-hidden">
        <AmbientBackground />
        <div className="relative z-10 flex min-h-screen">
          <div className="flex flex-col items-center gap-6">
            <SideNav current={page} onChange={handleNavigate} locked={!hasChatted} />
            <PetWidget completedCount={completedCount} />
          </div>
          <main className="flex-1 min-w-0 pb-28 md:pb-12">
            <div className="mx-auto w-full max-w-5xl px-5 sm:px-10 py-6 sm:py-12">
              <div className="md:hidden mb-6 flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#F4BDA8] to-[#E8A698] flex items-center justify-center shadow-sm">
                  <span className="font-serif text-white text-base leading-none">c</span>
                </div>
                <div>
                  <div className="font-serif text-[16px] text-[#2B2F2A] leading-tight">
                    Cognitive Lens
                  </div>
                  <div className="text-[10px] text-[#8A7E72] tracking-wider uppercase">
                    {currentLabel}
                  </div>
                </div>
              </div>
              {page === "chat" && (
                <ChatPage
                  onNavigate={handleNavigate}
                  onAnalysis={(a: any) => {
                    const hasGaps = a?.dependencies?.gapNodes?.length > 0;
                    const patched = hasGaps
                      ? a
                      : {
                          ...a,
                          dependencies: {
                            ...a?.dependencies,
                            nodes: a?.dependencies?.nodes?.length ? a.dependencies.nodes : [a?.input ?? "this topic"],
                            gapNodes: [
                              {
                                concept: a?.input ?? "this topic",
                                reason: "a good place to check your understanding before moving on",
                              },
                            ],
                          },
                        };
                    setLastAnalysis(patched);
                    setHasChatted(true);
                    setPage("synaptic");
                  }}
                  onFirstReply={() => setHasChatted(true)}
                />
              )}
              {page === "breakdown" && <BreakdownPage analysis={lastAnalysis} onStepComplete={() => setCompletedCount((c) => c + 1)} />}
              {page === "synaptic" && <SynapticPage analysis={lastAnalysis} topic={lastAnalysis?.input} />}
              {page === "reflection" && <ReflectionPage />}
              {page === "reminders" && <RemindersPage />}
            </div>
          </main>
        </div>
        <MobileNav current={page} onChange={handleNavigate} locked={!hasChatted} />
      </div>
    </ModeProvider>
  );
}