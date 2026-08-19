console.log("Cognitive Lens content loaded v2");

let lastPageStructure = null;
let clActive = false;

function injectBrainButton() {
  if (document.getElementById("cognitive-lens-brain-btn")) return;

  const btn = document.createElement("button");
  btn.id = "cognitive-lens-brain-btn";
  btn.textContent = "\u{1F9E0}";
  btn.title = "Cognitive Lens";

  Object.assign(btn.style, {
    position: "fixed", bottom: "24px", right: "24px", zIndex: "2147483647",
    width: "56px", height: "56px", borderRadius: "50%", border: "none",
    background: "#d99a4e", color: "#fff", fontSize: "26px", cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
  });

  btn.addEventListener("click", handleBrainClick);
  document.documentElement.appendChild(btn);
}

function handleBrainClick() {
  console.log("BRAIN BUTTON CLICKED v2");

  if (clActive && window.CognitiveLensTransform) {
    window.CognitiveLensTransform.revertPage();
    clActive = false;
    return;
  }

  if (window.CognitiveLensPageAnalyzer) {
    lastPageStructure = window.CognitiveLensPageAnalyzer.analyzePageStructure();
  }

  runAnalysis();
}

function looksLikeArticlePage() {
  const bodyText = (document.body.innerText || "").trim();
  const headingCount = document.querySelectorAll("h1, h2, h3").length;
  return bodyText.length > 500 && headingCount >= 1;
}

function runAnalysis() {
  if (!looksLikeArticlePage()) {
    console.log("Cognitive Lens: page doesn't look like an article, skipping.");
    return;
  }

  chrome.runtime.sendMessage({
    action: "analyze",
    text: document.body.innerText.slice(0, 20000),
    page: { title: document.title, url: window.location.href },
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action !== "analysis") return;

  console.log("Analysis received v2:", message.analysis);

  if (window.CognitiveLensTransform) {
    console.log("Calling transformPage v2 now");
    window.CognitiveLensTransform.transformPage(message.analysis, lastPageStructure);
    clActive = true;
  } else {
    console.error("CognitiveLensTransform is NOT defined at call time");
  }
});

injectBrainButton();


/* ===================== Accessibility Settings ===================== */

const CL_STYLE_ID = "cognitive-lens-a11y-style";

function clBuildCSS(settings) {
  const sizeMap = { normal: "100%", large: "115%", xlarge: "130%" };
  const scale = sizeMap[settings.fontSize] || "100%";

  let css = `
    html {
      font-size: ${scale} !important;
    }
  `;

  if (settings.dyslexicFont) {
    css += `
      @font-face {
        font-family: "OpenDyslexic";
        src: url("https://cdn.jsdelivr.net/fontsource/fonts/opendyslexic@latest/latin-400-normal.woff2") format("woff2");
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      * {
        font-family: "OpenDyslexic", "Comic Sans MS", sans-serif !important;
        letter-spacing: 0.03em !important;
        line-height: 1.6 !important;
      }
    `;
  }

  if (settings.highContrast) {
    css += `
      html {
        background: #000 !important;
      }
      body, body * {
        background-color: #000 !important;
        color: #ffe9a8 !important;
        border-color: #444 !important;
      }
      a, a * {
        color: #7ecbff !important;
      }
    `;
  }

  return css;
}

function clApplySettings(settings) {
  let styleTag = document.getElementById(CL_STYLE_ID);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = CL_STYLE_ID;
    document.documentElement.appendChild(styleTag);
  }
  styleTag.textContent = clBuildCSS(settings);
}

function clLoadAndApplySettings() {
  chrome.storage.sync.get(
    { fontSize: "normal", dyslexicFont: false, highContrast: false },
    (settings) => {
      clApplySettings(settings);
    },
  );
}

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    clLoadAndApplySettings();
  });
}

clLoadAndApplySettings();



/* ===================== Read Aloud (Text-to-Speech) ===================== */

let clSpeaking = false;

function clGetReadableText() {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script, style, nav, header, footer, noscript").forEach((el) => el.remove());
  return (clone.innerText || "").trim().slice(0, 6000);
}

function clSpeakWithVoices(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /Microsoft (Aria|Jenny|Guy|Ava|Andrew) Online \(Natural\)/.test(v.name) && v.lang === "en-US") ||
    voices.find((v) => /Online \(Natural\)/.test(v.name) && v.lang === "en-US") ||
    voices.find((v) => v.lang === "en-US" && !/Microsoft (David|Mark|Zira)/.test(v.name));
  if (preferred) {
    utterance.voice = preferred;
  }
  utterance.onend = () => {
    clSpeaking = false;
  };
  utterance.onerror = () => {
    clSpeaking = false;
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  clSpeaking = true;
}

function clToggleReadAloud() {
  if (clSpeaking) {
    window.speechSynthesis.cancel();
    clSpeaking = false;
    return;
  }

  const text = clGetReadableText();
  if (!text) return;

  const existingVoices = window.speechSynthesis.getVoices();
  if (existingVoices.length > 0) {
    clSpeakWithVoices(text);
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      clSpeakWithVoices(text);
    };
    window.speechSynthesis.getVoices();
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleReadAloud") {
    clToggleReadAloud();
  }
});