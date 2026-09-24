
import express from "express";
import dotenv from "dotenv";
import Conversation from "./models/Conversation.js";
import askGemini from "./services/gemini.js";
import {
    generateConversationSummary
} from "./services/memory.js";

import { clerkMiddleware } from "@clerk/express";
import { getAuth } from "@clerk/express";

dotenv.config();
console.log("Clerk secret loaded:", !!process.env.CLERK_SECRET_KEY);
console.log("Clerk publishable loaded:", !!process.env.CLERK_PUBLISHABLE_KEY);

import routeQuestion from "./router/router.js";
import weatherAgent from "./agents/weatherAgent.js";
import newsAgent from "./agents/newsAgent.js";
import githubAgent from "./agents/githubAgent.js";
import webAgent from "./agents/webAgent.js";
import blockchainAgent from "./agents/blockchainAgent.js";
import handleError from "./utils/errorHandler.js";

import connectDB from "./config/db.js";

import {
    getConversation,
    saveMessage
} from "./services/memory.js";

const app = express();

app.use(clerkMiddleware());

const PORT = process.env.PORT || 3000;

app.use(express.json());


// ========================
// HOME
// ========================

async function generateTitle(question) {
    const prompt = `
Create a short title for this conversation.

User message:
${question}

Rules:
- Maximum 5 words
- Keep it simple
- Return ONLY the title
`;

    const title = await askGemini(prompt);

    return title.trim();
}

app.get("/", (req, res) => {

    res.send("AI Agent Server is running");

});


// ========================
// CHAT
// ========================

app.get("/conversation/:conversationId", async (req, res) => {
    try {

           const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized. Please sign in."
            });
        }

        const conversationId = req.params.conversationId;

        const conversation = await Conversation.findOne({
            _id: conversationId,
             userId: userId
        });

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

     
        res.json({
            messages: conversation.messages
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to load conversation"
        });
    }
});

app.get("/conversations", async (req, res) =>  {
    try {
       
           const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized. Please sign in."
            });
        }

        const conversations = await Conversation.find(
            { userId: userId },
            { _id: 1, title: 1 }
        ).sort({
            _id: -1
        });

        res.json({
            conversations: conversations
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to load conversations"
        });
    }
});

app.post("/conversations", async (req, res) => {

    try {

       const { userId, isAuthenticated } = getAuth(req);

console.log("CONVERSATIONS AUTH TEST");
console.log("User ID:", userId);
console.log("Authenticated:", isAuthenticated);



        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized. Please sign in."
            });
        }

        const { title } = req.body;

        const conversation = await Conversation.create({
            userId: userId,
            title: title || "New Chat",
            messages: []
        });

        res.json({
            conversation: conversation
        });

    } 
    
catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to create conversation"
        });

    }

});

app.post("/chat", async (req, res) => {

    try {

        const { userId, isAuthenticated } = getAuth(req);

console.log("CHAT AUTH TEST");
console.log("User ID:", userId);
console.log("Authenticated:", isAuthenticated);
        
         if (!userId) {
    return res.status(401).json({
        error: "Unauthorized. Please sign in."
    });
}
        const conversationId = req.body.conversationId;
        const question = req.body.message;


        // ========================
        // VALIDATION
        // ========================

        if (!userId || !conversationId || !question) {

            return res.status(400).json({
                error: "userId, conversationId and message are required"
            });

        }


        // ========================
        // GET CONVERSATION
        // ========================

        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: userId
        });

        if (!conversation) {

            return res.status(404).json({
                error: "Conversation not found"
            });

        }


        // ========================
        // GENERATE TITLE
        // ========================

        if (conversation.messages.length === 0) {

            const title = await generateTitle(question);

            console.log("QUESTION:", question);
            console.log("GENERATED TITLE:", title);

            conversation.title = title;

        }


        // ========================
        // CONVERSATION HISTORY
        // ========================

        console.log("Conversation history:");
        console.log(conversation.messages);


        console.log("\nUser:");
        console.log(question);


        // ========================
        // RECENT CONTEXT
        // ========================

        const recentMessages = conversation.messages.slice(-10);

        const recentContext = recentMessages
            .map(message => `${message.role}: ${message.content}`)
            .join("\n");


        const context = `
Conversation summary:

${conversation.summary || "No previous summary available."}

Recent conversation:

${recentContext}
`;


        // ========================
        // ADD USER MESSAGE
        // ========================

        conversation.messages.push({
            role: "user",
            content: question,
            agent: "router"
        });


        // ========================
        // GENERATE SUMMARY
        // ========================

        if (
            conversation.messages.length >= 10 &&
            conversation.messages.length % 10 === 0
        ) {

            const oldMessages = conversation.messages.slice(0, -10);

            const summary = await generateConversationSummary(
                oldMessages,
                conversation.summary
            );

            conversation.summary = summary;

        }


        // ========================
        // SAVE USER MESSAGE
        // ========================

        await conversation.save();


        console.log("Context:");
        console.log(context);


        // ========================
        // STEP 1
        // ROUTER
        // ========================

        const route = await routeQuestion(
            question,
            context
        );

        console.log("Router result:", route);


        const agent = route.agent;
        const query = route.query;


        console.log("Selected agent:", agent);
        console.log("Agent query:", query);


        // ========================
        // STEP 2
        // RUN SELECTED AGENT
        // ========================

        let answer;


        if (agent === "weather") {

            answer = await weatherAgent(
                question,
                query,
                context
            );

        }


        else if (agent === "news") {

            answer = await newsAgent(
                question,
                query,
                context
            );

        }


        else if (agent === "github") {

            answer = await githubAgent(
                question,
                query,
                context
            );

        }


        else if (agent === "blockchain") {

            answer = await blockchainAgent(
                question,
                query,
                context
            );

        }


        else if (agent === "web") {

            answer = await webAgent(
                question,
                query,
                context
            );

        }


        else {

            return res.status(400).json({
                error: "Unknown agent"
            });

        }


        // ========================
        // STEP 3
        // SAVE ASSISTANT ANSWER
        // ========================

        conversation.messages.push({
            role: "assistant",
            content: answer,
            agent: agent
        });


        await conversation.save();


        // ========================
        // STEP 4
        // RETURN ANSWER
        // ========================

        return res.json({
            agent: agent,
            answer: answer,
             title: conversation.title
        });


    } catch (error) {

        const friendlyMessage = handleError(error);

        res.status(500).json({
            error: friendlyMessage
        });

    }

});

app.delete("/conversation/:conversationId", async (req, res) => {

    try {
       
           const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized. Please sign in."
            });
        }
        
        const conversationId = req.params.conversationId;

        console.log("Conversation ID:", conversationId);
        console.log("User ID:", userId);

        const conversation = await Conversation.findOneAndDelete({
            _id: conversationId,
            userId: userId
        });

        if (!conversation) {
            return res.status(404).json({
                error: "Conversation not found"
            });
        }

        res.json({
            message: "Conversation deleted successfully"
        });

    } catch (error) {

        console.error("DELETE ERROR:", error);

        res.status(500).json({
            error: error.message
        });
    }
});


// ========================
// MONGODB
// ========================

connectDB();


// ========================
// SERVER
// ========================

export default app;
















// import express from "express";
// import dotenv from "dotenv";
// import { GoogleGenAI } from "@google/genai";

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(express.json());


// // ===============================
// // Gemini setup
// // ===============================

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// });


// // ===============================
// // STEP 1
// // Gemini understands user question
// // ===============================

// async function getLocationFromLLM(question) {

//     const prompt = `
// You are a weather query parser.

// The user will ask a question about weather.

// Extract every city and date from the user's question.

// Return ONLY valid JSON.

// Format:

// [
//     {
//         "city": "Delhi",
//         "date": "today"
//     }
// ]

// Rules:

// 1. If user says today, return "today".
// 2. If user says tomorrow, return "tomorrow".
// 3. If multiple cities are mentioned, return multiple objects.
// 4. Do not give any explanation.
// 5. Return ONLY the JSON array.

// User question:
// ${question}
// `;

//     const interaction = await ai.interactions.create({
//         model: "gemini-3.6-flash",
//         input: prompt
//     });

//     const output = interaction.output_text;

//     console.log("LLM output:");
//     console.log(output);

//     return JSON.parse(output);
// }


// // ===============================
// // STEP 2
// // Get actual weather
// // ===============================

// async function getWeather(location) {

//     const weatherInfo = [];

//     for (const { city, date } of location) {

//         if (date.toLowerCase() === "today") {

//             const response = await fetch(
//                 `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}&aqi=no`
//             );

//             const data = await response.json();

//             weatherInfo.push(data);

//         } else {

//             const response = await fetch(
//                 `http://api.weatherapi.com/v1/future.json?key=${process.env.WEATHER_API_KEY}&q=${city}&dt=${date}`
//             );

//             const data = await response.json();

//             weatherInfo.push(data);
//         }
//     }

//     return weatherInfo;
// }

// // STEP 3
// // Send actual weather data to LLM


// async function generateWeatherReport(question, weatherData) {

//     const interaction = await ai.interactions.create({
//         model: "gemini-3.6-flash",
//         input: `
// User question:
// ${question}

// Weather data:
// ${JSON.stringify(weatherData)}

// Answer the user naturally and concisely.
// Answer in the same language as the user.
// `
//     });

// let response = interaction.output_text.trim();

// response = response
//     .replace(/\*\*/g, "")        // **bold**
//     .replace(/^\* /gm, "")       // * bullet
//     .replace(/^[-•] /gm, "")     // - or • bullet
//     .replace(/^#+\s*/gm, "")     // headings
//     .replace(/^---+$/gm, "")     // --- separator
//     .replace(/\n{2,}/g, "\n")     // extra blank lines
//     .trim();

// return response;
// }

// // ===============================
// // CHAT ROUTE
// // ===============================

// app.post("/chat", async (req, res) => {

//     try {


//         // User input from Postman


//         const question = req.body.message;

//         if (!question) {

//             return res.status(400).json({
//                 error: "message is required"
//             });
//         }

//         console.log("\nUser question:");
//         console.log(question);


//          // LLM #1
//         // Extract city and date


//         const location =
//             await getLocationFromLLM(question);

//         console.log("\nExtracted location:");
//         console.log(location);


//         // ---------------------------
//         // Weather API
//         // ---------------------------

//         const weatherData =
//             await getWeather(location);

//         console.log("\nWeather data received");


//         // ---------------------------
//         // LLM #2
//         // Generate final answer
//         // ---------------------------

//         const finalAnswer =
//             await generateWeatherReport(
//                 question,
//                 weatherData
//             );


//         // ---------------------------
//         // Send response to Postman
//         // ---------------------------

//         res.json({
//             answer: finalAnswer
//         });

//     } catch (error) {

//         console.error(error);

//         res.status(500).json({
//             error: error.message
//         });
//     }
// });


// // ===============================
// // START SERVER
// // ===============================

// app.listen(PORT, () => {

//     console.log(
//         `Server running at http://localhost:${PORT}`
//     );

// });



























// import { GoogleGenAI } from "@google/genai";
// import dotenv from "dotenv";

// dotenv.config();

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// });

// async function main() {
//     const interaction = await ai.interactions.create({
//         model: "gemini-3.6-flash",
//         input: msg
//     });

//     return interaction.output_text;
// }

// // weather leke aayega


// async function getWeather(location){

//     const weatherInfo= [];

// for(const {city,date} of location){

//     if(date.toLowerCase()== 'today')
// {
//   const response=  await fetch(`http://api.weatherapi.com/v1/current.json?key=57abde2fc683482890a164051263008&q=${city}`)
//   const data= await response.json();
//   weatherInfo.push(data);

// }

// else{

//       const response=  await fetch(`http://api.weatherapi.com/v1/future.json?key=57abde2fc683482890a164051263008&q=4{city}&dt=${date}`)
//   const data= await response.json();
//   weatherInfo.push(data);

// }

// }

// return weatherInfo;

// }


 





// export default main;