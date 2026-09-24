import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

console.log(
    "Gemini API key loaded:",
    !!process.env.GEMINI_API_KEY
);

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function askGemini(prompt) {

    const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: prompt
    });

    return interaction.output_text;
}

export default askGemini;