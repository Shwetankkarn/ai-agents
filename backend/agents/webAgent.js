import askGemini from "../services/gemini.js";
import webSearch from "../services/webSearch.js";


// ========================
// GENERATE WEB REPORT
// ========================

async function generateWebReport(
    question,
    searchResults,
    context
) {

    const prompt = `
Previous conversation:

${context}

Current user question:

${question}

Web search results:

${JSON.stringify(searchResults)}

Answer the user's question using the web search results.

Use the previous conversation when necessary to understand the question.

Answer naturally and concisely.
Answer in the same language as the user.

If the search results do not contain enough information, say so.
`;

    return await askGemini(prompt);
}


// ========================
// WEB AGENT
// ========================

async function webAgent(
    question,
    query,
    context
) {

    console.log("Web Agent called");

    const searchQuery = query.searchQuery;

    console.log("Web search query:");
    console.log(searchQuery);

    const searchResults = await webSearch(
        searchQuery
    );

    const answer = await generateWebReport(
        question,
        searchResults,
        context
    );

    return answer;
}


export default webAgent;