const axios = require('axios');
const FormData = require('form-data');

exports.transcribe = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No audio file provided." });
        }
        
        const form = new FormData();
        form.append('audio_file', req.file.buffer, req.file.originalname || 'recording.webm');
        
        const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://backend:8000';
        const response = await axios.post(`${mlServiceUrl}/voice/transcribe`, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        
        return res.status(200).json(response.data);
    } catch (error) {
        console.error("Voice proxy error:", error.message);
        return res.status(500).json({ message: "Failed to transcribe voice securely." });
    }
};
