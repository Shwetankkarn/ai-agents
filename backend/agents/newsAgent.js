import askGemini from "../services/gemini.js";
import getNews from "../services/news.js";



// GENERATE NEWS REPORT

async function generateNewsReport(
    question,
    newsData,
    context
) {

    const prompt = `
Previous conversation:

${context}

Current user question:

${question}

News data:

${JSON.stringify(newsData)}

Answer the user's question using the news data.

Use the previous conversation when necessary to understand the question.

Answer naturally and concisely.

Answer in the same language as the user.
When source URLs are available in the results, cite the relevant articles with Markdown links. Do not invent citations.
`;

    return await askGemini(prompt);
}


// ========================
// NEWS AGENT
// ========================

async function newsAgent(question, query, context) {

    const topics = query.topics;

    const newsData = await getNews(topics);

    const answer = await generateNewsReport(
        question,
        newsData,
        context
    );

    return answer;
}


export default newsAgent;
