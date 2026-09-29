async function getNews(topics) {

    const newsinfo = [];

    for (const topic of topics) {

        const response = await fetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`,
            { signal: AbortSignal.timeout(15000) }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "News API request failed");
        }

        newsinfo.push(data);
    }

    return newsinfo;
}

export default getNews;
