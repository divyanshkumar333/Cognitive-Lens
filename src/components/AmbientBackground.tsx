"use client";

export default function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">

      {/* Warm radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#F8D7CF_0%,transparent_45%),radial-gradient(circle_at_bottom_right,#F4E4D8_0%,transparent_50%)]" />

      {/* Animated blob 1 */}
      <div className="absolute -left-40 -top-32 h-[420px] w-[420px] animate-[floatOne_18s_ease-in-out_infinite] rounded-full bg-[#F6CFC8]/70 blur-[120px]" />

      {/* Animated blob 2 */}
      <div className="absolute right-[-120px] top-20 h-[360px] w-[360px] animate-[floatTwo_22s_ease-in-out_infinite] rounded-full bg-[#EEDFD5]/70 blur-[110px]" />

      {/* Animated blob 3 */}
      <div className="absolute bottom-[-180px] left-1/2 h-[460px] w-[460px] -translate-x-1/2 animate-[floatThree_24s_ease-in-out_infinite] rounded-full bg-[#F7ECE6]/80 blur-[140px]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.08) 1px,transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <style jsx>{`
        @keyframes floatOne {
          0%,100%{
            transform:translate(0px,0px) scale(1);
          }
          50%{
            transform:translate(60px,40px) scale(1.08);
          }
        }

        @keyframes floatTwo {
          0%,100%{
            transform:translate(0px,0px) scale(1);
          }
          50%{
            transform:translate(-50px,60px) scale(.95);
          }
        }

        @keyframes floatThree {
          0%,100%{
            transform:translateX(-50%) translateY(0px);
          }
          50%{
            transform:translateX(calc(-50% + 35px)) translateY(-45px);
          }
        }
      `}</style>

    </div>
  );
}
