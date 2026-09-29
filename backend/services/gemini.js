import dotenv from "dotenv";

dotenv.config();

async function askGemini(prompt) {

    const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",

            headers: {
                "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`,
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                model: "openrouter/free",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        }
    );

    if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenRouter API Error:", errorData);

        throw new Error("OpenRouter API request failed");
    }

    const data = await response.json();

    return data.choices[0].message.content;
}

export default askGemini;