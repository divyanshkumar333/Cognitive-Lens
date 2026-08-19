"use client";

const reminders = [
  { t: "Dentist appointment", d: "tomorrow, 2:00 PM", tag: "health" },
  { t: "History exam - alliance system", d: "tomorrow, 9:00 AM", tag: "study" },
  { t: "Reply to Prof. Anders' email", d: "today", tag: "admin" },
  { t: "Pay rent", d: "in 3 days", tag: "admin" },
  { t: "Pick up prescription", d: "in 2 days", tag: "health" },
  { t: "Submit lab report draft", d: "in 5 days", tag: "study" },
];

const tagTone: Record<string, string> = {
  health: "bg-[#E4E6DA] text-[#5A6B52]",
  study: "bg-[#FBE9DE] text-[#C97B6E]",
  admin: "bg-[#FCE3D8] text-[#A85F50]",
};

export default function RemindersPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="font-serif text-[32px] text-[#2B2F2A] tracking-tight leading-none">
          Reminders
        </h1>
        <p className="text-[12.5px] text-[#8A7E72] mt-1.5">what is coming up</p>
      </header>

      <section className="rounded-2xl bg-white/60 border border-white divide-y divide-[#F2E0D2]/60 overflow-hidden">
        {reminders.map((r) => (
          <div
            key={r.t}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/80 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C97B6E]/70 shrink-0" />
            <span className="text-[14px] text-[#2B2F2A] flex-1">{r.t}</span>
            <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 shrink-0 ${tagTone[r.tag]}`}>
              {r.tag}
            </span>
            <span className="text-[11px] text-[#A89687] shrink-0 w-24 text-right">{r.d}</span>
          </div>
        ))}
      </section>
    </div>
  );
}