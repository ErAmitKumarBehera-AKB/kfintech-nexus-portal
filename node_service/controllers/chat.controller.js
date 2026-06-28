const axios = require('axios');

exports.askAssistant = async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ message: "A question field is required to ask the AI Chatbot." });
    }

    try {
        // Proxy the request securely to the internal Python RAG Engine
        // This avoids exposing the raw Python microservice directly to the internet
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://backend:8000';
        const aiResponse = await axios.post(`${mlServiceUrl}/summarize/chat`, {
            message: question
        });

        // Return the exact KFintech policy AI response payload back to the frontend
        return res.status(200).json({
            message: "AI Chatbot generated a response successfully.",
            data: aiResponse.data
        });
    } catch (error) {
        console.error("AI Chatbot Proxy Engine Error:", error.message);
        return res.status(500).json({
            message: "Failed to securely communicate with the internal Python RAG endpoint.",
            error: error.message
        });
    }
};
