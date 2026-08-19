export interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

export async function searchWeb(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.error("TAVILY_API_KEY not set");
    return [];
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 4,
        search_depth: "basic",
      }),
    });

    if (!response.ok) {
      console.error("Tavily search failed:", response.status);
      return [];
    }

    const data = await response.json();
    return (data.results ?? []).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      content: r.content ?? "",
    }));
  } catch (err) {
    console.error("Tavily search error:", err);
    return [];
  }
}
