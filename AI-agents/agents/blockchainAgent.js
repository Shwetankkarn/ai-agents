import askGemini from "../services/gemini.js";
import getCryptoPrice from "../services/blockchain.js";


// ========================
// GENERATE BLOCKCHAIN REPORT
// ========================

async function generateBlockChainReport(
    question,
    cryptoData,
    context
) {

    const prompt = `
Previous conversation:

${context}

Current user question:

${question}

Cryptocurrency data:

${JSON.stringify(cryptoData)}

Answer the user's question using the cryptocurrency data.

Answer naturally and concisely.

Answer in the same language as the user.
`;

    return await askGemini(prompt);
}


// ========================
// BLOCKCHAIN AGENT
// ========================

async function blockchainAgent(
    question,
    query,
    context
) {

    console.log("BlockChain Agent called");

    const cryptocurrency = query.cryptocurrency;

    console.log("Cryptocurrency:");
    console.log(cryptocurrency);

    const cryptoData = await getCryptoPrice(
        cryptocurrency
    );

    const answer = await generateBlockChainReport(
        question,
        cryptoData,
        context
    );

    return answer;
}


export default blockchainAgent;