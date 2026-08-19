// focusMode.js

function enableFocusMode() {
  console.log("🧠 Enabling Focus Mode");

  /* ---------------------------------
       Hide distracting UI
    ---------------------------------- */

  const hideSelectors = [
    "#mw-panel",

    "#mw-navigation",

    "#vector-toc",

    ".vector-sticky-header",

    ".mw-portlet",

    ".vector-column-start",

    ".vector-page-toolbar",

    ".mw-footer",

    "#footer",
  ];

  hideSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.display = "none";
    });
  });

  /* ---------------------------------
       Improve reading layout
    ---------------------------------- */

  const article =
    document.querySelector("#content") ||
    document.querySelector("#mw-content-text") ||
    document.querySelector("article") ||
    document.querySelector("main");

  if (!article) return;

  article.style.maxWidth = "900px";
  article.style.margin = "50px auto";
  article.style.padding = "30px";

  article.style.lineHeight = "1.95";

  article.style.fontSize = "19px";

  article.style.fontFamily = "Inter, ui-sans-serif, system-ui, sans-serif";

  article.style.transition = "all .7s ease";

  /* ---------------------------------
       Warm reading background
    ---------------------------------- */

  document.body.style.background = "#F8F5EF";

  document.body.style.transition = "background .8s ease";

  /* ---------------------------------
       Semantic fading
    ---------------------------------- */

  const paragraphs = article.querySelectorAll("p");

  paragraphs.forEach((p, index) => {
    p.style.transition = "opacity .8s ease, filter .8s ease";

    if (index < 5) {
      p.style.opacity = "1";

      p.style.filter = "none";
    } else if (index < 10) {
      p.style.opacity = ".82";
    } else {
      p.style.opacity = ".45";

      p.style.filter = "blur(.2px)";
    }
  });

  /* ---------------------------------
       Headings
    ---------------------------------- */

  article.querySelectorAll("h1,h2,h3").forEach((h) => {
    h.style.marginTop = "42px";

    h.style.marginBottom = "18px";

    h.style.fontWeight = "700";

    h.style.color = "#111";

    h.style.letterSpacing = "-0.02em";
  });

  console.log("🧠 Focus Mode enabled.");
}
