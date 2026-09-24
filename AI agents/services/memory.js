import Conversation from "../models/Conversation.js";
import askGemini from "./gemini.js";

async function getConversation(userId) {

    let conversation = await Conversation.findOne({
        userId: userId
    });

    if (!conversation) {

        conversation = await Conversation.create({
            userId: userId,
            messages: []
        });

    }

    return conversation;
}


async function saveMessage(
    userId,
    role,
    content,
    agent
) {

    const conversation = await getConversation(userId);

    conversation.messages.push({

        role: role,
        content: content,
        agent: agent

    });

    await conversation.save();
}

async function generateConversationSummary(
    messages,
    existingSummary = ""
) {

    const conversationText = messages
        .map(message => `${message.role}: ${message.content}`)
        .join("\n");

    const prompt = `
Update the conversation summary.

Existing summary:

${existingSummary || "No existing summary."}

Additional conversation messages:

${conversationText}

Create an updated short summary.

Rules:
- Preserve important information from the existing summary.
- Add important information from the new messages.
- Remove unnecessary details.
- Preserve important user preferences, facts and decisions.
- Do not add information that is not present.
- Return only the updated summary.
`;

    return await askGemini(prompt);
}

export {
    getConversation,
    saveMessage,
    generateConversationSummary
};