chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.action !== "analyze") {
    return;
  }
  try {
    const response = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message.text,
        page: message.page,
      }),
    });
    const analysis = await response.json();
    console.log("Backend analysis:", analysis);
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "analysis",
        analysis,
      });
    }
  } catch (error) {
    console.error("Backend error:", error);
  }
});