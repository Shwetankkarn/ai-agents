import askGemini from "../services/gemini.js";
import getWeather from "../services/weather.js";


async function generateWeatherReport(question, weatherData, context) {

    const prompt = `
Previous conversation:

${context}

User question:

${question}

Weather data:

${JSON.stringify(weatherData)}

Answer the user naturally and concisely.

Answer in the same language as the user.
`;

    return await askGemini(prompt);
}


async function weatherAgent(question, query, context) {

    console.log("Weather Agent called");

    // 1. Get weather directly using router query
    const weatherData = await getWeather([query]);

    // 2. Generate final answer
    const answer = await generateWeatherReport(
        question,
        weatherData,
        context
    );

    return answer;
}


export default weatherAgent;