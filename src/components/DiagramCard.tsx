"use client";

export default function DiagramCard() {
  return (
    <section className="rounded-[32px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.08)]">

      <h2 className="text-2xl font-semibold">
        Hidden Structure
      </h2>

      <p className="mt-2 text-zinc-500">
        The AI discovered these relationships.
      </p>

      <div className="relative mt-10 h-[320px] rounded-[24px] bg-[#FAF8F6]">

        <svg className="absolute inset-0 h-full w-full">

          <line x1="50%" y1="18%" x2="22%" y2="46%" stroke="#E7D7CF" strokeWidth="2"/>

          <line x1="50%" y1="18%" x2="78%" y2="46%" stroke="#E7D7CF" strokeWidth="2"/>

          <line x1="22%" y1="46%" x2="34%" y2="78%" stroke="#E7D7CF" strokeWidth="2"/>

          <line x1="78%" y1="46%" x2="66%" y2="78%" stroke="#E7D7CF" strokeWidth="2"/>

        </svg>

        <div className="absolute left-1/2 top-[18%] -translate-x-1/2 rounded-full bg-[#F2B9AA] px-6 py-3 font-semibold shadow-lg">
          Main Topic
        </div>

        <div className="absolute left-[22%] top-[46%] -translate-x-1/2 rounded-full bg-white px-5 py-3 shadow">
          Concept A
        </div>

        <div className="absolute left-[78%] top-[46%] -translate-x-1/2 rounded-full bg-white px-5 py-3 shadow">
          Concept B
        </div>

        <div className="absolute left-[34%] top-[78%] -translate-x-1/2 rounded-full bg-white px-5 py-3 shadow">
          Dependency
        </div>

        <div className="absolute left-[66%] top-[78%] -translate-x-1/2 rounded-full bg-white px-5 py-3 shadow">
          Insight
        </div>

      </div>

    </section>
  );
}
