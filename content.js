console.log("Cognitive Lens content loaded");

/* ----------------------------------------------------------
   Inject page script (optional)
---------------------------------------------------------- */

if (!document.getElementById("cognitive-lens-inject")) {
  const script = document.createElement("script");
  script.id = "cognitive-lens-inject";
  script.src = chrome.runtime.getURL("inject.js");
  document.documentElement.appendChild(script);
}

/* ----------------------------------------------------------
   Supported websites
---------------------------------------------------------- */

const SUPPORTED_SITES = [
  "canvas",
  "moodle",
  "blackboard",
  "notion",
  "docs.google",
  "wikipedia",
  "github",
  "medium",
];

let lastPageStructure = null;
let clActive = false;

/* ----------------------------------------------------------
   Brain button
---------------------------------------------------------- */

function injectBrainButton() {
  if (document.getElementById("cognitive-lens-brain-btn")) return;

  const btn = document.createElement("button");
  btn.id = "cognitive-lens-brain-btn";
  btn.textContent = "\u{1F9E0}";
  btn.title = "Cognitive Lens: Transform Workspace";

  Object.assign(btn.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: "2147483647",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: "none",
    background: "#d99a4e",
    color: "#fff",
    fontSize: "26px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
  });

  btn.addEventListener("click", handleBrainClick);
  document.documentElement.appendChild(btn);
}

function handleBrainClick() {
  if (clActive && window.CognitiveLensTransform) {
    window.CognitiveLensTransform.revertPage();
    clActive = false;
    document.getElementById("cognitive-lens-brain-btn").style.background =
      "#d99a4e";
    return;
  }

  runAnalysis();
}

/* ----------------------------------------------------------
   Analyze page
---------------------------------------------------------- */

function isSupportedSite() {
  const currentURL = window.location.href.toLowerCase();
  return SUPPORTED_SITES.some((site) => currentURL.includes(site));
}

function runAnalysis() {
  console.log("Cognitive Lens activated.");

  if (!isSupportedSite()) {
    console.log("Unsupported website.");
    return;
  }

  console.log("Supported site detected.");

  if (window.CognitiveLensPageAnalyzer) {
    lastPageStructure = window.CognitiveLensPageAnalyzer.analyzePageStructure();
  }

  chrome.runtime.sendMessage({
    action: "analyze",
    text: document.body.innerText.slice(0, 20000),
    page: {
      title: document.title,
      url: window.location.href,
    },
  });
}

/* ----------------------------------------------------------
   Receive AI analysis
---------------------------------------------------------- */

chrome.runtime.onMessage.addListener((message) => {
  if (message.action !== "analysis") {
    return;
  }

  console.log("Analysis received.");

  createStickyNote(message.analysis);

  if (window.CognitiveLensTransform) {
    window.CognitiveLensTransform.transformPage(
      message.analysis,
      lastPageStructure,
    );
    clActive = true;

    const btn = document.getElementById("cognitive-lens-brain-btn");
    if (btn) btn.style.background = "#8a6a45";
  }

  if (
    message.analysis.interface &&
    message.analysis.interface.mode === "focus"
  ) {
    enableFocusMode();
  }
});

/* ----------------------------------------------------------
   Start
---------------------------------------------------------- */

injectBrainButton();
