const DEFAULTS = {
  fontSize: "normal",
  dyslexicFont: false,
  highContrast: false,
};

function applyActiveButton(size) {
  document.querySelectorAll("#fontSizeGroup button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.size === size);
  });
}

function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, (settings) => {
    applyActiveButton(settings.fontSize);
    document.getElementById("dyslexicToggle").checked = settings.dyslexicFont;
    document.getElementById("contrastToggle").checked = settings.highContrast;
  });
}

function saveSetting(partial) {
  chrome.storage.sync.set(partial);
}

document.getElementById("fontSizeGroup").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const size = btn.dataset.size;
  applyActiveButton(size);
  saveSetting({ fontSize: size });
});

document.getElementById("dyslexicToggle").addEventListener("change", (e) => {
  saveSetting({ dyslexicFont: e.target.checked });
});

document.getElementById("contrastToggle").addEventListener("change", (e) => {
  saveSetting({ highContrast: e.target.checked });
});

loadSettings();


document.getElementById("readAloudBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: "toggleReadAloud" });
  });
});
