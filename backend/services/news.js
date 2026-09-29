async function getNews(topics) {

    const newsinfo = [];

    for (const topic of topics) {

        console.log("Fetching news for:", topic);

        const response = await fetch(
            `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`
        );

        console.log("NewsAPI status:", response.status);

        const data = await response.json();

        //    console.log("NewsAPI response:", data);

           if (!response.ok) {
    throw new Error(data.message || "News API request failed");
         }

           newsinfo.push(data);
    }

    return newsinfo;
}

export default getNews;