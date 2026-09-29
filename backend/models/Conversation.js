
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

    role: {
        type: String,
        required: true
    },

    content: {
        type: String,
        required: true
    },

    agent: {
        type: String,
        required: true
    },
      timestamp: {
        type: Date,
        default: Date.now
    }

});

const conversationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },

    title: {
        type: String,
        default: "New Chat"
    },

    summary: {
        type: String,
        default: ""
    },

    messages: [messageSchema]
});

const Conversation = mongoose.model(
    "Conversation",
    conversationSchema
);


export default Conversation;
