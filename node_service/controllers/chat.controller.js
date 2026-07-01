const axios = require('axios');
const ChatSession = require('../models/ChatSession');

const getSessionId = (req) => {
    return req.headers['x-session-id'] || (req.user ? req.user.id : null);
};

exports.getHistory = async (req, res) => {
    try {
        const sessionId = getSessionId(req);
        if (!sessionId) return res.status(200).json({ messages: [] });

        const session = await ChatSession.findOne({ sessionId });
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
    const sessionId = getSessionId(req);

    if (!question) {
        return res.status(400).json({ message: "A question field is required to ask the AI Chatbot." });
    }
    
    if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required." });
    }

    try {
        // Fetch or create chat session
        let session = await ChatSession.findOne({ sessionId });
        if (!session) {
            session = new ChatSession({ 
                sessionId,
                userId: req.user ? req.user.id : undefined,
                messages: [] 
            });
        }

        // Save User Message
        const userMsg = {
            type: 'user',
            text: question,
            timestamp: new Date()
        };
        session.messages.push(userMsg);
        
        // Format history for ML Service
        const historyForMl = session.messages.slice(-6).map(m => ({
            type: m.type,
            text: m.text
        }));

        // Proxy the request to Python RAG Engine
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
        const aiResponse = await axios.post(`${mlServiceUrl}/chatbot/ask`, {
            question: question,
            history: historyForMl
        });

        const mlData = aiResponse.data;

        // Save Bot Message
        const botMsg = {
            type: 'bot',
            text: mlData.response || "No response.",
            sources: mlData.retrieved_data_source || [],
            sentiment: mlData.sentiment || "NEUTRAL",
            timestamp: new Date()
        };
        session.messages.push(botMsg);
        await session.save();

        return res.status(200).json({
            message: "AI Chatbot generated a response successfully.",
            data: {
                ...mlData,
                botMessage: botMsg 
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
