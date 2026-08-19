/* ----------------------------------------------------------
   Cognitive Lens — Page Transform Engine
   Applies warm palette + collapses/dims low-priority elements
   based on live DOM importance tagging. Fully reversible.
---------------------------------------------------------- */

const CL_STATE = {
  active: false,
  originalStyles: new Map(),
  injectedStyleEl: null,
};

function applyWarmPalette() {
  if (CL_STATE.injectedStyleEl) return;

  const style = document.createElement("style");
  style.id = "cognitive-lens-palette";
  style.textContent = `
    html.cognitive-lens-active {
      background-color: #f5ede1 !important;
      filter: sepia(0.08) contrast(0.97);
    }
    html.cognitive-lens-active body {
      background-color: #f5ede1 !important;
      color: #3a2f28 !important;
    }
    html.cognitive-lens-active * {
      transition: opacity 0.4s ease, filter 0.4s ease, max-height 0.4s ease;
    }
    .cognitive-lens-dimmed {
      opacity: 0.15 !important;
      filter: grayscale(0.6) blur(0.3px) !important;
      pointer-events: none !important;
    }
    .cognitive-lens-collapsed {
      max-height: 0 !important;
      overflow: hidden !important;
      opacity: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .cognitive-lens-focus {
      background: #fffaf0 !important;
      border-left: 3px solid #d99a4e !important;
      padding-left: 12px !important;
      line-height: 1.7 !important;
    }
  `;
  document.head.appendChild(style);
  CL_STATE.injectedStyleEl = style;
}

function saveOriginalState(el) {
  if (!CL_STATE.originalStyles.has(el)) {
    CL_STATE.originalStyles.set(el, el.className);
  }
}

function transformPage(analysis, pageStructure) {
  applyWarmPalette();

  document.documentElement.classList.add("cognitive-lens-active");
  CL_STATE.active = true;

  const mode = analysis?.interface?.mode ?? "normal";

  if (!pageStructure || !pageStructure.taggedElements) {
    return;
  }

  pageStructure.taggedElements.forEach(({ el, importance }) => {
    if (!el || !el.classList) return;

    saveOriginalState(el);

    el.classList.remove(
      "cognitive-lens-dimmed",
      "cognitive-lens-collapsed",
      "cognitive-lens-focus",
    );

    if (importance === "low") {
      if (mode === "focus") {
        el.classList.add("cognitive-lens-collapsed");
      } else {
        el.classList.add("cognitive-lens-dimmed");
      }
    } else if (importance === "high") {
      el.classList.add("cognitive-lens-focus");
    }
  });
}

function revertPage() {
  document.documentElement.classList.remove("cognitive-lens-active");

  CL_STATE.originalStyles.forEach((originalClassName, el) => {
    if (el && el.classList) {
      el.className = originalClassName;
    }
  });

  CL_STATE.originalStyles.clear();
  CL_STATE.active = false;
}

window.CognitiveLensTransform = {
  transformPage,
  revertPage,
  isActive: () => CL_STATE.active,
};
