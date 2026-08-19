"use client";

import { motion } from "framer-motion";

const nodes = [
  {
    id: 1,
    title: "Main Idea",
    x: "50%",
    y: "12%",
    size: "large",
  },
  {
    id: 2,
    title: "Concept A",
    x: "18%",
    y: "40%",
  },
  {
    id: 3,
    title: "Concept B",
    x: "82%",
    y: "40%",
  },
  {
    id: 4,
    title: "Dependency",
    x: "32%",
    y: "78%",
  },
  {
    id: 5,
    title: "Insight",
    x: "68%",
    y: "78%",
  },
];

export default function SynapticSpace() {
  return (
    <section className="rounded-[32px] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,.07)]">

      <div className="mb-6">

        <p className="text-sm text-zinc-500">
          Synaptic Space
        </p>

        <h2 className="text-2xl font-semibold">
          Concept Relationships
        </h2>

      </div>

      <div className="relative h-[420px] overflow-hidden rounded-[28px] bg-[#FAF8F6]">

        <svg className="absolute inset-0 h-full w-full">

          <line x1="50%" y1="14%" x2="18%" y2="40%" stroke="#E8D7CF" strokeWidth="2"/>

          <line x1="50%" y1="14%" x2="82%" y2="40%" stroke="#E8D7CF" strokeWidth="2"/>

          <line x1="18%" y1="40%" x2="32%" y2="78%" stroke="#E8D7CF" strokeWidth="2"/>

          <line x1="82%" y1="40%" x2="68%" y2="78%" stroke="#E8D7CF" strokeWidth="2"/>

        </svg>

        {nodes.map((node) => (

          <motion.div
            key={node.id}
            animate={{
              y: [0,-6,0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4 + node.id,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: node.x,
              top: node.y,
            }}
          >

            <div
              className={`rounded-full bg-white shadow-lg border border-[#EFE3DD]
              ${
                node.size === "large"
                  ? "px-8 py-6"
                  : "px-5 py-4"
              }`}
            >

              <p className="text-sm font-medium whitespace-nowrap">
                {node.title}
              </p>

            </div>

          </motion.div>

        ))}

      </div>

    </section>
  );
}
