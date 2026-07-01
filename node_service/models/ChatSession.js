const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['user', 'bot'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    sources: [{
        type: String
    }],
    sentiment: {
        type: String,
        enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL', '']
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ChatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    messages: [ChatMessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
