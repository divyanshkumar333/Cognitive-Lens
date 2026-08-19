try {
  var CL_STATE = { active: false, overlayEl: null, currentIndex: -1, sections: [] };

  var COMPLEXITY_COLOR = { low: "#7a9a6a", medium: "#d99a4e", high: "#c0392b" };

  function buildLoadingScreen() {
    var el = document.createElement("div");
    el.id = "cognitive-lens-overlay";
    el.style.cssText =
      "position:fixed; inset:0; z-index:2147483647; background:#1c1712;" +
      "display:flex; flex-direction:column; align-items:center; justify-content:center;" +
      "color:#f5ede1; font-family:'Segoe UI', Arial, sans-serif; opacity:0; transition:opacity 0.4s ease;";
    el.innerHTML =
      "<div style='font-size:46px; margin-bottom:18px;'>\u{1F9E0}</div>" +
      "<div id='cl-loading-text' style='font-size:18px; letter-spacing:1px; color:#d99a4e; font-weight:600;'>Analyzing structure...</div>" +
      "<div style='width:220px; height:4px; background:rgba(255,255,255,0.1); border-radius:4px; margin-top:22px; overflow:hidden;'>" +
      "<div id='cl-loading-bar' style='width:0%; height:100%; background:#d99a4e; border-radius:4px; transition:width 2.2s ease;'></div>" +
      "</div>";
    return el;
  }

  function sanitizeBlockHtml(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    div.querySelectorAll("*").forEach(function (el) {
      el.removeAttribute("style");
      el.removeAttribute("width");
      el.removeAttribute("height");
    });
    div.querySelectorAll("a").forEach(function (a) {
      a.style.color = "#a8763a";
      a.style.fontWeight = "600";
      a.style.textDecoration = "underline";
      a.style.textDecorationColor = "rgba(168,118,58,0.4)";
    });
    div.querySelectorAll("table").forEach(function (t) {
      t.style.maxWidth = "100%";
      t.style.width = "100%";
      t.style.borderCollapse = "collapse";
      t.style.fontSize = "16px";
    });
    div.querySelectorAll("p, li, span, div").forEach(function (el) {
      el.style.fontSize = "20px";
      el.style.lineHeight = "1.9";
    });
    return div.innerHTML;
  }

  function renderBlock(block) {
    if (block.type === "image" && block.src) {
      var src = block.src;
      if (src.startsWith("//")) src = "https:" + src;
      var caption = block.caption ? "<div style=" + String.fromCharCode(39) + "font-size:14px; color:#8a6a45; text-align:center; margin-top:8px; font-style:italic;" + String.fromCharCode(39) + ">" + block.caption + "</div>" : "";
      return (
        "<div style='background:#fdf6ea; border-radius:16px; padding:16px; margin:20px 0; box-shadow:0 4px 14px rgba(0,0,0,0.06); text-align:center;'>" +
        "<img src='" + src + "' style='max-width:100%; max-height:320px; border-radius:10px; object-fit:contain;' />" +
        caption +
        "</div>"
      );
    }
    if (block.type === "html") {
      var safeHtml = sanitizeBlockHtml(block.html);
      return (
        "<div style='background:#fffaf0; border-radius:14px; padding:20px 22px; margin:14px 0; box-shadow:0 3px 10px rgba(0,0,0,0.04); font-family:Georgia, serif; font-size:20px; line-height:1.9; color:#2e241c; max-width:100%; overflow-wrap:break-word; overflow-x:auto;'>" +
        safeHtml +
        "</div>"
      );
    }
    return "";
  }

  function buildShell(analysis, pageStructure) {
    var sections = (pageStructure && pageStructure.sections) || [];
    var title = (pageStructure && pageStructure.title) || document.title;
    var stats = (pageStructure && pageStructure.statistics) || {};
    var difficulty = (analysis && analysis.task && analysis.task.complexity) || "medium";

    CL_STATE.sections = sections;
    CL_STATE.currentIndex = -1;

    var wrap = document.createElement("div");
    wrap.id = "cognitive-lens-overlay";
    wrap.style.cssText =
      "position:fixed; inset:0; background:#f7efe0; display:flex; opacity:0; transition:opacity 0.6s ease;" +
      "font-family:'Segoe UI', Arial, sans-serif; z-index:2147483647;";

    var tocHtml = "<div id='cl-toc' style='width:230px; flex-shrink:0; background:#efe3cd; height:100vh; overflow-y:auto; padding:24px 18px; box-sizing:border-box; border-right:1px solid rgba(0,0,0,0.08); transition:width 0.3s ease, padding 0.3s ease;'>";
    tocHtml += "<div style='font-size:12px; letter-spacing:2px; color:#a8763a; font-weight:700; margin-bottom:16px;'>\u{1F9E0} COGNITIVE LENS</div>";
    tocHtml += "<div style='font-size:13px; color:#8a6a45; font-weight:700; margin-bottom:10px;'>CONTENTS</div>";
    sections.forEach(function (s, i) {
      var indent = s.level === "H3" ? "16px" : "0px";
      tocHtml += "<div class='cl-toc-link' data-index='" + i + "' style='cursor:pointer; padding:7px 0 7px " + indent + "; font-size:14px; color:#5a4632; border-bottom:1px solid rgba(0,0,0,0.05); word-wrap:break-word;'>" + s.text + "</div>";
    });
    tocHtml += "</div>";

    var startSection = sections[0];
    var mainHtml = "<div id='cl-main' style='flex:1; height:100vh; overflow-y:auto; display:flex; justify-content:center; padding:40px 20px; box-sizing:border-box;'>";
    mainHtml += "<div id='cl-card' style='width:100%; max-width:740px; box-sizing:border-box;'>";

    mainHtml += "<div style='background:#fffaf0; border-radius:28px; box-shadow:0 20px 60px rgba(0,0,0,0.15); padding:44px 48px; box-sizing:border-box; margin-bottom:20px;'>";
    mainHtml += "<h1 style='font-family:Georgia, serif; font-size:36px; margin:0 0 14px 0; color:#2e241c; font-weight:700; overflow-wrap:break-word;'>" + title + "</h1>";

    mainHtml += "<div style='display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;'>";
    mainHtml += statPill("\u{1F9E0}", "Reading Time", (stats.readingMinutes || 1) + " min");
    mainHtml += statPill("\u26A1", "Cognitive Load", difficulty);
    mainHtml += "</div>";

    if (startSection) {
      mainHtml += "<div style='background:rgba(217,154,78,0.14); border-left:4px solid #d99a4e; border-radius:10px; padding:12px 16px; margin-top:12px;'>";
      mainHtml += "<div style='font-size:12px; color:#a8763a; font-weight:700; letter-spacing:0.5px;'>\u{1F3AF} RECOMMENDED STARTING POINT</div>";
      mainHtml += "<div style='font-family:Georgia, serif; font-size:16px; color:#2e241c; margin-top:4px;'>" + startSection.text + "</div>";
      mainHtml += "</div>";
    }

    mainHtml += "<div id='cl-start-wrap' style='text-align:center; padding:30px 0 10px 0;'>";
    mainHtml += "<button type='button' id='cl-start-btn' style='padding:16px 34px; background:#d99a4e; color:#fff; border:none; border-radius:14px; font-size:17px; font-weight:700; cursor:pointer; box-shadow:0 8px 20px rgba(217,154,78,0.3);'>\u25B6 Start Reading</button>";
    mainHtml += "</div>";
    mainHtml += "</div>";

    mainHtml += "<div id='cl-reader' style='display:none; max-width:100%; box-sizing:border-box;'></div>";
    mainHtml += "</div></div>";

    var iconsHtml =
      "<div style='position:fixed; bottom:28px; right:28px; display:flex; flex-direction:column; gap:12px; z-index:2147483647;'>" +
      "<button type='button' id='cl-brain-panel-btn' title='Your Brain' style='width:52px;height:52px;border-radius:50%;border:none;background:#2e241c;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.3);'>\u{1F9E0}</button>" +
      "<button type='button' id='cl-download-btn' title='Download Notes' style='width:52px;height:52px;border-radius:50%;border:none;background:#d99a4e;color:#fff;font-size:20px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.3);'>\u2B07</button>" +
      "<button type='button' id='cl-exit-btn' title='Exit' style='width:52px;height:52px;border-radius:50%;border:none;background:#7a6a55;color:#fff;font-size:18px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,0.3);'>\u2715</button>" +
      "</div>";

    var brainPanelHtml =
      "<div id='cl-brain-panel' style='position:fixed; bottom:96px; right:28px; width:310px; max-height:60vh; background:#fffaf0; border-radius:18px; box-shadow:0 12px 40px rgba(0,0,0,0.3); box-sizing:border-box; display:none; flex-direction:column; z-index:2147483647; overflow:hidden;'>" +
      "<div style='display:flex; align-items:center; background:#efe3cd;'>" +
      "<button type='button' class='cl-brain-tab' data-tab='status' style='flex:1; padding:12px; border:none; background:#fffaf0; font-size:13px; font-weight:700; color:#8a5a1f; cursor:pointer;'>\u{1F9E0} Status</button>" +
      "<button type='button' class='cl-brain-tab' data-tab='notes' style='flex:1; padding:12px; border:none; background:transparent; font-size:13px; font-weight:700; color:#8a5a1f; cursor:pointer;'>\u270F Notes</button>" +
      "<button type='button' id='cl-brain-close-btn' title='Close' style='width:36px; height:36px; flex-shrink:0; border:none; background:transparent; color:#8a5a1f; font-size:16px; cursor:pointer;'>\u2715</button>" +
      "</div>" +
      "<div id='cl-brain-status' style='padding:16px; overflow-y:auto;'></div>" +
      "<div id='cl-brain-notes' style='display:none; flex:1; padding:16px; flex-direction:column;'>" +
      "<textarea id='cl-notes-textarea' style='flex:1; min-height:180px; resize:none; border:1px solid rgba(0,0,0,0.1); border-radius:10px; padding:10px; font-family:Georgia, serif; font-size:15px; color:#2e241c;' placeholder='Type notes while you read...'></textarea>" +
      "</div>" +
      "</div>";

    wrap.innerHTML = tocHtml + mainHtml + iconsHtml + brainPanelHtml;
    return wrap;
  }

  function statPill(icon, label, value) {
    return (
      "<div style='background:rgba(217,154,78,0.1); border-radius:10px; padding:10px 12px;'>" +
      "<div style='font-size:11px; color:#a8763a; font-weight:700;'>" + icon + " " + label.toUpperCase() + "</div>" +
      "<div style='font-size:15px; color:#2e241c; font-weight:700; text-transform:capitalize;'>" + value + "</div>" +
      "</div>"
    );
  }

  function updateBrainStatus(root) {
    var sections = CL_STATE.sections;
    var i = CL_STATE.currentIndex;
    var statusEl = root.querySelector("#cl-brain-status");
    if (i < 0 || !sections[i]) {
      statusEl.innerHTML = "<div style='font-size:14px; color:#a8926f;'>Start reading to see your progress here.</div>";
      return;
    }

    var s = sections[i];
    var next = sections[i + 1];
    var progress = Math.round(((i + 1) / sections.length) * 100);

    var html = "";
    html += "<div style='font-size:11px; color:#a8763a; font-weight:700; margin-bottom:4px;'>CURRENT TOPIC</div>";
    html += "<div style='font-family:Georgia, serif; font-size:16px; color:#2e241c; margin-bottom:14px;'>" + s.text + "</div>";

    html += "<div style='font-size:11px; color:#a8763a; font-weight:700; margin-bottom:6px;'>PROGRESS</div>";
    html += "<div style='background:rgba(0,0,0,0.08); border-radius:8px; height:10px; overflow:hidden; margin-bottom:14px;'>";
    html += "<div style='background:#d99a4e; height:100%; width:" + progress + "%;'></div>";
    html += "</div>";

    if (s.complexity) {
      var cc = COMPLEXITY_COLOR[s.complexity.label] || "#d99a4e";
      html += "<div style='font-size:11px; color:#a8763a; font-weight:700; margin-bottom:6px;'>SECTION COMPLEXITY</div>";
      html += "<div style='background:rgba(0,0,0,0.08); border-radius:8px; height:8px; overflow:hidden; margin-bottom:4px;'>";
      html += "<div style='background:" + cc + "; height:100%; width:" + s.complexity.score + "%;'></div>";
      html += "</div>";
      html += "<div style='font-size:13px; color:" + cc + "; font-weight:700; text-transform:capitalize; margin-bottom:14px;'>" + s.complexity.label + "</div>";
    }

    if (s.concepts && s.concepts.length) {
      html += "<div style='font-size:11px; color:#a8763a; font-weight:700; margin-bottom:6px;'>KEY CONCEPTS</div>";
      html += "<div style='margin-bottom:14px;'>";
      s.concepts.forEach(function (c) {
        html += "<div style='font-size:14px; color:#5a4632; padding:3px 0;'>\u2022 " + c + "</div>";
      });
      html += "</div>";
    }

    html += "<div style='font-size:11px; color:#a8763a; font-weight:700; margin-bottom:6px;'>NEXT STEP</div>";
    html += "<div style='font-size:14px; color:#5a4632;'>" + (next ? next.text : "You'll be done!") + "</div>";

    statusEl.innerHTML = html;
  }

  function renderSection(root, index) {
    var sections = CL_STATE.sections;
    if (index < 0 || index >= sections.length) return;

    CL_STATE.currentIndex = index;
    var s = sections[index];
    var reader = root.querySelector("#cl-reader");
    var tag = s.level.toLowerCase();

    var blocksHtml = (s.blocks || []).map(renderBlock).join("");
    if (!blocksHtml) blocksHtml = "<div style='background:#fffaf0; border-radius:14px; padding:18px; font-style:italic; color:#a8926f;'>No content extracted for this section.</div>";

    var conceptsHtml = "";
    if (s.concepts && s.concepts.length) {
      conceptsHtml = "<div style='display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;'>";
      s.concepts.forEach(function (c) {
        conceptsHtml += "<span style='background:rgba(217,154,78,0.15); color:#a8763a; font-size:13px; font-weight:600; padding:5px 12px; border-radius:20px;'>" + c + "</span>";
      });
      conceptsHtml += "</div>";
    }

    var complexityHtml = "";
    if (s.complexity) {
      var cc = COMPLEXITY_COLOR[s.complexity.label] || "#d99a4e";
      complexityHtml =
        "<div style='display:flex; align-items:center; gap:8px; margin-top:10px;'>" +
        "<span style='font-size:12px; color:" + cc + "; font-weight:700; text-transform:uppercase;'>" + s.complexity.label + " complexity</span>" +
        "<div style='flex:1; max-width:100px; background:rgba(0,0,0,0.08); border-radius:6px; height:6px; overflow:hidden;'>" +
        "<div style='background:" + cc + "; height:100%; width:" + s.complexity.score + "%;'></div>" +
        "</div></div>";
    }

    var prevTitle = index > 0 ? sections[index - 1].text : null;
    var whyHtml =
      "<div style='background:#2e241c; color:#f5ede1; border-radius:14px; padding:16px 20px; margin-bottom:18px;'>" +
      "<div style='font-size:12px; letter-spacing:1px; color:#d99a4e; font-weight:700; margin-bottom:6px;'>\u{1F9E0} WHY AM I READING THIS?</div>" +
      "<div style='font-size:15px; line-height:1.6;'>Section " + (index + 1) + " of " + sections.length +
      (prevTitle ? " \u2014 this follows \u201C" + prevTitle + "\u201D." : " \u2014 this is where the article begins.") +
      "</div></div>";

    var html = "<div style='opacity:0; transition:opacity 0.4s ease;' id='cl-current-section'>";
    html += whyHtml;
    html += "<div style='background:#fdf6ea; border-radius:16px; padding:16px 22px; margin-bottom:18px; box-shadow:0 4px 14px rgba(0,0,0,0.06);'>";
    html += "<" + tag + " style='font-family:Georgia, serif; font-size:26px; color:#a8763a; margin:0; font-weight:700;'>" + s.text + "</" + tag + ">";
    html += "<div style='font-size:13px; color:#a8926f; margin-top:6px;'>\u23F1 ~" + (s.estMinutes || 1) + " min</div>";
    html += complexityHtml;
    html += conceptsHtml;
    html += "</div>";
    html += blocksHtml;
    html += "<div style='margin-top:24px; display:flex; justify-content:flex-end;'>";
    if (index < sections.length - 1) {
      html += "<button type='button' id='cl-next-btn' style='padding:12px 26px; background:#d99a4e; color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700; cursor:pointer;'>Next \u2192</button>";
    } else {
      html += "<div style='font-size:15px; color:#7a9a6a; font-weight:700;'>\u2713 You've reached the end</div>";
    }
    html += "</div></div>";

    reader.innerHTML = html;

    requestAnimationFrame(function () {
      var el = root.querySelector("#cl-current-section");
      if (el) el.style.opacity = "1";
    });

    root.querySelectorAll(".cl-toc-link").forEach(function (link) {
      var i = parseInt(link.getAttribute("data-index"), 10);
      link.style.background = (i === index) ? "rgba(217,154,78,0.2)" : "transparent";
      link.style.fontWeight = (i === index) ? "700" : "normal";
    });

    updateBrainStatus(root);

    var nextBtn = root.querySelector("#cl-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        renderSection(root, index + 1);
        collapseSidebar(root);
      });
    }
  }

  function collapseSidebar(root) {
    var toc = root.querySelector("#cl-toc");
    toc.style.width = "0px";
    toc.style.padding = "24px 0px";
    toc.style.overflow = "hidden";
  }

  function expandSidebar(root) {
    var toc = root.querySelector("#cl-toc");
    toc.style.width = "230px";
    toc.style.padding = "24px 18px";
    toc.style.overflow = "auto";
  }

  function enterMinimalMode(root) {
    root.querySelector("#cl-start-wrap").style.display = "none";
    root.querySelector("#cl-reader").style.display = "block";
    collapseSidebar(root);
    renderSection(root, 0);
  }

  function wireInteractions(root) {
    var startBtn = root.querySelector("#cl-start-btn");
    if (startBtn) {
      startBtn.addEventListener("click", function () {
        enterMinimalMode(root);
      });
    }

    root.querySelectorAll(".cl-toc-link").forEach(function (link) {
      link.addEventListener("click", function () {
        var i = parseInt(link.getAttribute("data-index"), 10);
        if (root.querySelector("#cl-start-wrap").style.display !== "none") {
          enterMinimalMode(root);
        }
        renderSection(root, i);
        collapseSidebar(root);
      });
    });

    var toc = root.querySelector("#cl-toc");
    toc.addEventListener("mouseenter", function () {
      if (CL_STATE.currentIndex >= 0) expandSidebar(root);
    });
    toc.addEventListener("mouseleave", function () {
      if (CL_STATE.currentIndex >= 0) collapseSidebar(root);
    });

    var brainPanel = root.querySelector("#cl-brain-panel");
    var brainBtn = root.querySelector("#cl-brain-panel-btn");
    if (brainBtn) {
      brainBtn.addEventListener("click", function () {
        var isOpen = brainPanel.style.display === "flex";
        brainPanel.style.display = isOpen ? "none" : "flex";
        if (!isOpen) updateBrainStatus(root);
      });
    }

    var brainCloseBtn = root.querySelector("#cl-brain-close-btn");
    if (brainCloseBtn) {
      brainCloseBtn.addEventListener("click", function () {
        brainPanel.style.display = "none";
      });
    }

    root.querySelectorAll(".cl-brain-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");
        root.querySelector("#cl-brain-status").style.display = target === "status" ? "block" : "none";
        root.querySelector("#cl-brain-notes").style.display = target === "notes" ? "flex" : "none";
        root.querySelectorAll(".cl-brain-tab").forEach(function (t) {
          t.style.background = (t === tab) ? "#fffaf0" : "transparent";
        });
      });
    });

    var downloadBtn = root.querySelector("#cl-download-btn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", function () {
        var ta = root.querySelector("#cl-notes-textarea");
        var text = ta ? ta.value : "";
        var blob = new Blob([text], { type: "text/plain" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "cognitive-lens-notes.txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }

    var exitBtn = root.querySelector("#cl-exit-btn");
    if (exitBtn) {
      exitBtn.addEventListener("click", revertPage);
    }
  }

  function transformPage(analysis, pageStructure) {
    if (CL_STATE.overlayEl) return;

    var loading = buildLoadingScreen();
    document.documentElement.appendChild(loading);
    CL_STATE.overlayEl = loading;
    CL_STATE.active = true;

    requestAnimationFrame(function () {
      loading.style.opacity = "1";
      var bar = loading.querySelector("#cl-loading-bar");
      if (bar) bar.style.width = "100%";
    });

    var texts = ["Analyzing structure...", "Mapping sections...", "Identifying key concepts...", "Preparing your workspace..."];
    var step = 0;
    var textEl = loading.querySelector("#cl-loading-text");
    var textInterval = setInterval(function () {
      step++;
      if (textEl && texts[step]) textEl.textContent = texts[step];
    }, 600);

    setTimeout(function () {
      clearInterval(textInterval);
      loading.remove();

      var shell = buildShell(analysis, pageStructure);
      document.documentElement.appendChild(shell);
      CL_STATE.overlayEl = shell;
      wireInteractions(shell);

      requestAnimationFrame(function () {
        shell.style.opacity = "1";
      });

      console.log("Cognitive Lens: shell rendered,", CL_STATE.sections.length, "sections");
    }, 2400);
  }

  function revertPage() {
    if (CL_STATE.overlayEl) {
      var el = CL_STATE.overlayEl;
      el.style.opacity = "0";
      setTimeout(function () { el.remove(); }, 400);
      CL_STATE.overlayEl = null;
    }
    CL_STATE.active = false;
  }

  window.CognitiveLensTransform = {
    transformPage: transformPage,
    revertPage: revertPage,
    isActive: function () { return CL_STATE.active; }
  };
  console.log("Cognitive Lens: transform.js loaded OK (v15 - complexity indicator)");
} catch (err) {
  console.error("Cognitive Lens transform.js FAILED:", err);
}
