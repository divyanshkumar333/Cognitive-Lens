"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  ScanSearch,
  Network,
  CheckCircle2,
} from "lucide-react";

interface Props {
  active: boolean;
}

const steps = [
  {
    icon: ScanSearch,
    title: "Scanning document",
  },
  {
    icon: Brain,
    title: "Detecting cognitive friction",
  },
  {
    icon: Network,
    title: "Building concept graph",
  },
  {
    icon: Sparkles,
    title: "Generating adaptive interface",
  },
];

export default function ScanOverlay({
  active,
}: Props) {
  return (
    <AnimatePresence>

      {active && (

        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-[#F8F5F1]/80 backdrop-blur-xl"
        >

          <motion.div
            initial={{
              scale: .92,
              opacity: 0,
            }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: .95,
              opacity: 0,
            }}
            className="w-[92%] max-w-md rounded-[34px] bg-white p-8 shadow-[0_40px_120px_rgba(0,0,0,.12)]"
          >

            <div className="flex justify-center">

              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F6D6CF]"
              >

                <Brain size={34} />

              </motion.div>

            </div>

            <h2 className="mt-8 text-center text-2xl font-semibold">
              Cognitive Analysis
            </h2>

            <p className="mt-2 text-center text-zinc-500">
              Understanding structure instead of summarizing text...
            </p>

            <div className="mt-10 space-y-5">

              {steps.map((step, i) => {

                const Icon = step.icon;

                return (

                  <motion.div
                    key={step.title}
                    initial={{
                      opacity: 0,
                      x: -25,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    transition={{
                      delay: i * .45,
                    }}
                    className="flex items-center justify-between rounded-2xl bg-[#FAFAFA] px-5 py-4"
                  >

                    <div className="flex items-center gap-4">

                      <Icon size={20} />

                      <span className="font-medium">
                        {step.title}
                      </span>

                    </div>

                    <motion.div
                      animate={{
                        scale: [1,1.2,1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    >

                      <CheckCircle2
                        size={20}
                        className="text-emerald-500"
                      />

                    </motion.div>

                  </motion.div>

                );

              })}

            </div>

            <div className="mt-10 h-3 overflow-hidden rounded-full bg-zinc-100">

              <motion.div
                initial={{
                  width: "0%",
                }}
                animate={{
                  width: "100%",
                }}
                transition={{
                  duration: 4,
                }}
                className="h-full rounded-full bg-gradient-to-r from-[#F2B9AA] to-[#D89D8D]"
              />

            </div>

          </motion.div>

        </motion.div>

      )}

    </AnimatePresence>
  );
}
