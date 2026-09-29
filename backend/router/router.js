import askGemini from "../services/gemini.js";

const liveAgents = ["weather", "news", "github", "blockchain", "web"];

async function routeQuestion(question, context, requestedSector = "auto") {

    const prompt = `
You are an AI request router.

Decide which agent should handle the user's request.

Available agents:

weather
news
github
blockchain
web
expert


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
10. If the user selected a sector, use it as the response focus. Still use a live agent when the user needs current weather, news, GitHub, cryptocurrency prices, or web research.
11. Use the expert agent for writing, coding, education, healthcare information, law and public services, business, finance education, science, agriculture, climate, accessibility, translation, planning, and any other subject.
12. For the web agent, put the search text in query.search (not searchQuery).
13. Return ONLY JSON, with no markdown fences or explanation.

User-selected sector: ${requestedSector}


Previous conversation:

${context}

Current user question:

${question}
`;

    const output = await askGemini(prompt);

    let route;
    try {
        route = JSON.parse(output.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
    } catch {
        return { agent: "expert", query: { focus: requestedSector } };
    }

    if (!liveAgents.includes(route?.agent) && route?.agent !== "expert") {
        return { agent: "expert", query: { focus: requestedSector } };
    }

    route.query = route.query && typeof route.query === "object" ? route.query : {};
    if (route.agent === "weather" && typeof route.query.city !== "string") {
        return { agent: "expert", query: { focus: requestedSector } };
    }
    if (route.agent === "weather" && typeof route.query.date !== "string") route.query.date = "today";
    if (route.agent === "news" && (!Array.isArray(route.query.topics) || !route.query.topics.some((topic) => typeof topic === "string" && topic.trim()))) {
        return { agent: "expert", query: { focus: requestedSector } };
    }
    if (route.agent === "github") {
        if (typeof route.query.username !== "string" || !Array.isArray(route.query.actions)) {
            return { agent: "expert", query: { focus: requestedSector } };
        }
        route.query.actions = route.query.actions.filter((action) => ["profile", "repositories"].includes(action));
        if (!route.query.actions.length) return { agent: "expert", query: { focus: requestedSector } };
    }
    if (route.agent === "blockchain" && typeof route.query.cryptocurrency !== "string") {
        return { agent: "expert", query: { focus: requestedSector } };
    }
    if (route.agent === "web") {
        route.query.search = route.query.search || route.query.searchQuery || question;
        if (typeof route.query.search !== "string") route.query.search = question;
    }
    return route;
}

export default routeQuestion;
