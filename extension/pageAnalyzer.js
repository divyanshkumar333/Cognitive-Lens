try {
  function firstSentence(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    var text = (div.innerText || "").trim();
    if (!text) return "";
    var match = text.match(/^.{0,180}?[\.\!\?](\s|$)/);
    return match ? match[0].trim() : text.slice(0, 140).trim();
  }

  function extractConcepts(blocks) {
    var seen = {};
    var concepts = [];
    blocks.forEach(function (b) {
      if (b.type !== "html") return;
      var div = document.createElement("div");
      div.innerHTML = b.html;
      div.querySelectorAll("a, strong, b").forEach(function (a) {
        var t = a.innerText.trim();
        if (t.length > 2 && t.length < 40 && !seen[t.toLowerCase()]) {
          seen[t.toLowerCase()] = true;
          concepts.push(t);
        }
      });
    });
    return concepts.slice(0, 5);
  }

  function computeComplexity(blocks) {
    var text = "";
    blocks.forEach(function (b) {
      if (b.type === "html") {
        var div = document.createElement("div");
        div.innerHTML = b.html;
        text += " " + (div.innerText || "");
      }
    });
    text = text.trim();
    if (!text) return { score: 0, label: "low" };

    var sentences = text.split(/[\.\!\?]+/).filter(function (s) { return s.trim().length > 0; });
    var words = text.split(/\s+/).filter(Boolean);
    var avgSentenceLen = words.length / Math.max(1, sentences.length);
    var longWords = words.filter(function (w) { return w.replace(/[^a-zA-Z]/g, "").length > 7; });
    var longWordRatio = longWords.length / Math.max(1, words.length);

    var score = (avgSentenceLen / 25) * 0.6 + (longWordRatio) * 0.4;
    score = Math.max(0, Math.min(1, score));

    var label = score < 0.35 ? "low" : score < 0.65 ? "medium" : "high";
    return { score: Math.round(score * 100), label: label };
  }

  var GENERIC_JUNK_SELECTOR =
    "nav, aside, footer, header, .sidebar, .advertisement, .ad, .ads, .comments, .comment-section, " +
    ".related-posts, .related-articles, .navbox, .infobox, .metadata, .reflist, .mw-references-wrap, " +
    ".mw-editsection, .catlinks, .ambox, .social-share, .newsletter-signup, .cookie-banner, " +
    "style, script, noscript, form, iframe";

  function getArticleRoot() {
    var candidates = [
      "#mw-content-text .mw-parser-output",
      "#mw-content-text",
      ".mw-parser-output",
      "article",
      "main[role='main']",
      "main",
      "[role='article']",
      ".post-content",
      ".article-content",
      ".entry-content",
      "#content"
    ];

    for (var i = 0; i < candidates.length; i++) {
      var el = document.querySelector(candidates[i]);
      if (el && (el.innerText || "").trim().length > 200) {
        return el;
      }
    }
    return document.body;
  }

  function isJunkHeading(h) {
    if (h.closest(GENERIC_JUNK_SELECTOR)) return true;
    if (h.closest(".vector-menu, .vector-dropdown, #p-lang, .interlanguage-link, .vector-page-toolbar")) return true;
    var text = h.innerText.trim().toLowerCase();
    if (!text || text.length < 2) return true;
    if (["contents", "languages", "tools", "navigation", "menu", "share", "subscribe"].indexOf(text) > -1) return true;
    return false;
  }

  function getWalkStart(h) {
    var wrapper = h.closest(".mw-heading");
    return wrapper || h;
  }

  function cleanBlock(node) {
    var clone = node.cloneNode(true);
    clone.querySelectorAll("sup.reference, .mw-cite-backlink, .mw-editsection, .noprint, .reference, style, script, .error, .ad, .advertisement, .social-share").forEach(function (el) {
      el.remove();
    });
    return clone;
  }

  function extractBlocks(startNode) {
    var blocks = [];
    var node = startNode.nextElementSibling;
    var guard = 0;

    while (node && guard < 300) {
      guard++;
      var isNextHeadingWrapper = node.classList && node.classList.contains("mw-heading") && node.querySelector("h1, h2, h3");
      var isDirectHeading = /^H[123]$/.test(node.tagName);
      if (isNextHeadingWrapper || isDirectHeading) break;

      var isJunkBlock = node.matches && node.matches(GENERIC_JUNK_SELECTOR);

      if (!isJunkBlock) {
        var clean = cleanBlock(node);
        var imgs = clean.querySelectorAll ? clean.querySelectorAll("img") : [];

        if (imgs.length > 0) {
          imgs.forEach(function (img) {
            var caption = "";
            var figParent = img.closest("figure, .thumb, .thumbinner");
            if (figParent) {
              var capEl = figParent.querySelector(".thumbcaption, figcaption");
              if (capEl) caption = capEl.innerText.trim();
            }
            var realSrc = img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || img.getAttribute("src");
            if (realSrc) blocks.push({ type: "image", src: realSrc, caption: caption });
          });
        } else if (clean.tagName === "TABLE") {
          if (clean.querySelectorAll("tr").length < 15) {
            blocks.push({ type: "html", html: clean.outerHTML });
          }
        } else {
          var text = (clean.innerText || "").trim();
          if (text.length > 3) {
            blocks.push({ type: "html", html: clean.outerHTML });
          }
        }
      }
      node = node.nextElementSibling;
    }
    return blocks;
  }

  function analyzePageStructure() {
    var root = getArticleRoot();

    var headingEls = Array.prototype.slice
      .call(root.querySelectorAll("h1, h2, h3"))
      .filter(function (h) { return !isJunkHeading(h); });

    var sections = [];
    headingEls.forEach(function (h, i) {
      var startNode = getWalkStart(h);
      var blocks = extractBlocks(startNode);

      var textLength = blocks.reduce(function (acc, b) {
        if (b.type === "html") {
          var div = document.createElement("div");
          div.innerHTML = b.html;
          return acc + (div.innerText || "").trim().length;
        }
        return acc;
      }, 0);

      if (textLength < 15 && blocks.filter(function (b) { return b.type === "image"; }).length === 0) return;

      var firstHtmlBlock = blocks.filter(function (b) { return b.type === "html"; })[0];
      var takeaway = firstHtmlBlock ? firstSentence(firstHtmlBlock.html) : "";
      var wordCount = blocks.reduce(function (acc, b) {
        if (b.type !== "html") return acc;
        var div = document.createElement("div");
        div.innerHTML = b.html;
        return acc + (div.innerText || "").trim().split(/\s+/).length;
      }, 0);

      var complexity = computeComplexity(blocks);

      sections.push({
        id: "cl-section-" + i,
        level: h.tagName,
        text: h.innerText.trim(),
        blocks: blocks,
        takeaway: takeaway,
        concepts: extractConcepts(blocks),
        estMinutes: Math.max(1, Math.round(wordCount / 200)),
        complexity: complexity,
        importance: i === 0 ? "critical" : i < 3 ? "high" : "medium"
      });
    });

    if (sections.length === 0) {
      var fallbackText = (root.innerText || "").trim();
      var fallbackBlocks = [{ type: "html", html: "<p>" + fallbackText.slice(0, 6000).replace(/\n/g, "<br>") + "</p>" }];
      sections.push({
        id: "cl-section-0",
        level: "H2",
        text: document.title || "Full Article",
        blocks: fallbackBlocks,
        takeaway: firstSentence(fallbackText),
        concepts: [],
        estMinutes: Math.max(1, Math.round(fallbackText.split(/\s+/).length / 200)),
        complexity: computeComplexity(fallbackBlocks),
        importance: "critical"
      });
    }

    var stats = {
      links: root.querySelectorAll("a").length,
      images: root.querySelectorAll("img").length,
      tables: root.querySelectorAll("table").length,
      sections: sections.length
    };

    var words = (root.innerText || "").trim().split(/\s+/).length;
    stats.readingMinutes = Math.max(1, Math.min(60, Math.round(words / 220)));

    return {
      title: (document.title || "").replace(/ - Wikipedia.*$/i, "").replace(/\s*[\|\-\u2013]\s*[^|\-\u2013]{1,40}$/, ""),
      url: window.location.href,
      sections: sections,
      statistics: stats
    };
  }

  window.CognitiveLensPageAnalyzer = { analyzePageStructure: analyzePageStructure };
  console.log("Cognitive Lens: pageAnalyzer.js loaded OK (v9 generic + complexity)");
} catch (err) {
  console.error("Cognitive Lens pageAnalyzer.js FAILED:", err);
}
