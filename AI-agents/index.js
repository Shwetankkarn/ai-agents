
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Conversation from "./models/Conversation.js";
import askGemini from "./services/gemini.js";
import {
    generateConversationSummary
} from "./services/memory.js";

import { clerkMiddleware } from "@clerk/express";
import { getAuth } from "@clerk/express";

dotenv.config();

import routeQuestion from "./router/router.js";
import weatherAgent from "./agents/weatherAgent.js";
import newsAgent from "./agents/newsAgent.js";
import githubAgent from "./agents/githubAgent.js";
import webAgent from "./agents/webAgent.js";
import blockchainAgent from "./agents/blockchainAgent.js";
import expertAgent from "./agents/expertAgent.js";
import handleError from "./utils/errorHandler.js";

import connectDB from "./config/db.js";


const app = express();
const supportedSectors = new Set(["auto", "research", "writing", "coding", "education", "business", "data", "healthcare", "law", "public-services", "finance", "science", "agriculture", "languages"]);

app.use((req, res, next) => {
    const allowedOrigin = process.env.CORS_ORIGIN;

    if (allowedOrigin && req.headers.origin === allowedOrigin) {
        res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    }

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.use(clerkMiddleware());

app.use((req, res, next) => {
    if (req.url === "/api") {
        req.url = "/";
    } else if (req.url.startsWith("/api/")) {
        req.url = req.url.slice(4);
    }

    next();
});

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "32kb" }));

app.use(async (req, res, next) => {
    if (req.path === "/") return next();
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database unavailable:", error.name);
        res.status(503).json({ error: "Conversation storage is temporarily unavailable." });
    }
});


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

app.get(["/", "/api"], (req, res) => {
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
        console.error("Conversation load failed:", error.name);

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
        console.error("Conversation list failed:", error.name);

        res.status(500).json({
            error: "Failed to load conversations"
        });
    }
});

app.post("/conversations", async (req, res) => {

    try {

       const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized. Please sign in."
            });
        }

        const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 100) : "";

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

        const { userId } = getAuth(req);
        
         if (!userId) {
    return res.status(401).json({
        error: "Unauthorized. Please sign in."
    });
}
        const body = req.body || {};
        const conversationId = body.conversationId;
        const question = typeof body.message === "string" ? body.message.trim() : "";
        const requestedSector = supportedSectors.has(body.sector) ? body.sector : "auto";


        // ========================
        // VALIDATION
        // ========================

        if (!conversationId || !question) {

            return res.status(400).json({
                error: "conversationId and a non-empty message are required"
            });

        }

        if (!mongoose.isValidObjectId(conversationId)) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        if (question.length > 6000) {
            return res.status(413).json({ error: "Please keep messages under 6,000 characters." });
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


            conversation.title = title;

        }


        // ========================
        // CONVERSATION HISTORY
        // ========================


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


        // ========================
        // STEP 1
        // ROUTER
        // ========================

        const route = await routeQuestion(
            question,
            context,
            requestedSector
        );



        const agent = route.agent;
        const query = route.query;




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

        else if (agent === "expert") {
            answer = await expertAgent(
                question,
                requestedSector === "auto" ? (query.focus || "auto") : requestedSector,
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
        if (!mongoose.isValidObjectId(conversationId)) {
            return res.status(404).json({ error: "Conversation not found" });
        }


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
            error: "Failed to delete conversation"
        });
    }
});


// ========================
// MONGODB
// ========================

// ========================
// SERVER
// ========================

export default app;

if (process.env.VERCEL !== "1") {
    app.listen(PORT, () => {
        console.log(`AI Agent Server listening on port ${PORT}`);
    });
}
