
async function webSearch(query) {

    const response = await fetch(
        "https://api.tavily.com/search",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: query,
                search_depth: "basic",
                max_results: 5
            }),
            signal: AbortSignal.timeout(15000)
        }
    );

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Web search request failed");
    return data.results || [];
}

export default webSearch;
