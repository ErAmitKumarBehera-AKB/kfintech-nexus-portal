const axios = require('axios');
const ChatSession = require('../models/ChatSession');

exports.getHistory = async (req, res) => {
    try {
        const session = await ChatSession.findOne({ userId: req.user.id });
        if (!session) {
            return res.status(200).json({ messages: [] });
        }
        res.status(200).json({ messages: session.messages });
    } catch (error) {
        console.error("Fetch history error:", error);
        res.status(500).json({ message: "Failed to fetch chat history." });
    }
};

exports.askAssistant = async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ message: "A question field is required to ask the AI Chatbot." });
    }

    try {
        // 1. (Removed Ticket Context - strict RAG FAQ only)

        // 2. Fetch or create chat session
        let session = await ChatSession.findOne({ userId: req.user.id });
        if (!session) {
            session = new ChatSession({ userId: req.user.id, messages: [] });
        }

        // 3. Save User Message
        const userMsg = {
            type: 'user',
            text: question,
            timestamp: new Date()
        };
        session.messages.push(userMsg);
        
        // 4. Format history for ML Service
        // We only send the last 6 messages to keep the prompt size reasonable
        const historyForMl = session.messages.slice(-6).map(m => ({
            type: m.type,
            text: m.text
        }));

        // 5. Proxy the request to Python RAG Engine
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const aiResponse = await axios.post(`${mlServiceUrl}/chatbot/ask`, {
            question: question,
            history: historyForMl
        });

        const mlData = aiResponse.data;

        // 6. Save Bot Message
        const botMsg = {
            type: 'bot',
            text: mlData.response || "No response.",
            sources: mlData.retrieved_data_source || [],
            sentiment: mlData.sentiment || "NEUTRAL",
            timestamp: new Date()
        };
        session.messages.push(botMsg);
        await session.save();

        // 7. Return payload
        return res.status(200).json({
            message: "AI Chatbot generated a response successfully.",
            data: {
                ...mlData,
                botMessage: botMsg // Include the formatted message for the UI
            }
        });
    } catch (error) {
        console.error("AI Chatbot Proxy Engine Error:", error.message);
        return res.status(500).json({
            message: "Failed to securely communicate with the internal Python RAG endpoint.",
            error: error.message
        });
    }
};
