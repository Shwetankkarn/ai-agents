import askGemini from "../services/gemini.js";

import {
    getGithubUser,
    getGithubRepos
} from "../services/github.js";


// ========================
// GENERATE GITHUB REPORT
// ========================

async function generateGithubReport(
    question,
    githubData,
    context
) {

    const prompt = `
Previous conversation:

${context}

Current user question:

${question}

GitHub data:

${JSON.stringify(githubData)}

Answer the user's question using the GitHub data.

Use the previous conversation when necessary to understand the question.

Answer naturally and concisely.

Answer in the same language as the user.
`;

    return await askGemini(prompt);
}


// ========================
// GITHUB AGENT
// ========================

async function githubAgent(
    question,
    query,
    context
) {

    const username = query.username;
    const actions = query.actions;

    let githubData = {};


    // ========================
    // PROFILE
    // ========================

    if (actions.includes("profile")) {

        githubData.profile = await getGithubUser(
            username
        );

    }


    // ========================
    // REPOSITORIES
    // ========================

    if (actions.includes("repositories")) {

        githubData.repositories = await getGithubRepos(
            username
        );

    }


    // ========================
    // FINAL ANSWER
    // ========================

    const answer = await generateGithubReport(
        question,
        githubData,
        context
    );

    return answer;
}


export default githubAgent;
