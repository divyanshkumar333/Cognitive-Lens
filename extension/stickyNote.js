// stickyNote.js

function removeSummary() {
  document.getElementById("cognitive-lens-summary")?.remove();
}

function createStickyNote(analysis) {
  removeSummary();

  const article =
    document.querySelector("#mw-content-text") ||
    document.querySelector("#content") ||
    document.querySelector("article") ||
    document.querySelector("main");

  if (!article) {
    console.log("❌ Article container not found.");
    return;
  }

  const summary = document.createElement("section");

  summary.id = "cognitive-lens-summary";

  summary.innerHTML = `
        <div class="cl-summary-header">

            <h2>🧠 Cognitive Lens</h2>

            <span class="cl-status">
                ${
                  analysis.interface?.mode === "focus"
                    ? "Focus Mode"
                    : "Reading Mode"
                }
            </span>

        </div>

        <div class="cl-summary-grid">

            <div class="cl-card">

                <h4>Summary</h4>

                <p>
                    ${analysis.explanation?.summary ?? "No summary available."}
                </p>

            </div>

            <div class="cl-card">

                <h4>First Action</h4>

                <p>
                    ${analysis.decision?.firstAction ?? "Continue reading."}
                </p>

            </div>

            <div class="cl-card">

                <h4>Difficulty</h4>

                <p>
                    ${analysis.task?.complexity ?? "Unknown"}
                </p>

            </div>

            <div class="cl-card">

                <h4>Reading Mode</h4>

                <p>
                    ${analysis.interface?.mode ?? "Normal"}
                </p>

            </div>

        </div>
    `;

  article.prepend(summary);

  console.log("🧠 Summary injected.");
}
