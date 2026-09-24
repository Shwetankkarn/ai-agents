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
`;

    return await askGemini(prompt);
}


// ========================
// NEWS AGENT
// ========================

async function newsAgent(question, query, context) {

    console.log("News Agent called");

    const topics = query.topics;

    console.log("News topics:");
    console.log(topics);

    const newsData = await getNews(topics);

    const answer = await generateNewsReport(
        question,
        newsData,
        context
    );

    return answer;
}


export default newsAgent;