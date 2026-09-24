import askGemini from "../services/gemini.js";

async function routeQuestion(question, context) {

    const prompt = `
You are an AI request router.

Decide which agent should handle the user's request.

Available agents:

weather
news
github
blockchain
web


========================
WEATHER
========================

If the request is about weather, extract the city and date.

Return:

{
    "agent": "weather",
    "query": {
        "city": "Delhi",
        "date": "today"
    }
}


========================
NEWS
========================

If the request is about latest news, headlines, current events, or recent news, extract all topics.

Return:

{
    "agent": "news",
    "query": {
        "topics": ["AI", "Bitcoin"]
    }
}


========================
GITHUB
========================

If the request is about GitHub users, profiles, repositories, stars, commits, issues, or pull requests, extract the username and required actions.

Available actions:

profile
repositories

Return:

{
    "agent": "github",
    "query": {
        "username": "shwetank",
        "actions": ["profile", "repositories"]
    }
}


========================
BLOCKCHAIN
========================

If the request is about Bitcoin, Ethereum, cryptocurrency, blockchain, wallets, transactions, or crypto prices, extract the cryptocurrency name.

Return:

{
    "agent": "blockchain",
    "query": {
        "cryptocurrency": "Ethereum"
    }
}


========================
WEB
========================

If the request is a general internet search, website search, documentation, tutorial, blog, or information that does not belong to the other agents, extract a simple search query.

Return:

{
    "agent": "web",
    "query": {
        "search": "React useEffect tutorial"
    }
}


========================
RULES
========================

1. Always return valid JSON.
2. Always include "agent".
3. Always include "query".
4. For weather, extract city and date.
5. For news, extract all requested topics.
6. For github, extract username and required actions.
7. For blockchain, extract cryptocurrency name.
8. For web, create a simple search query.
9. Use previous conversation when necessary to understand the current question.
10. Do not give any explanation.
11. Return ONLY JSON.


Previous conversation:

${context}

Current user question:

${question}
`;

    const output = await askGemini(prompt);

    console.log("Router output:");
    console.log(output);

    return JSON.parse(output);
}

export default routeQuestion;