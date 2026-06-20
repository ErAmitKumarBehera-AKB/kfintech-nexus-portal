require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and utility middleware
app.use(cors());
app.use(express.json());

// Setup MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kfintech_nexus';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB Database.'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// TODO: Import your route files here once created
// Route setup
const ticketRoutes = require('./routes/ticket.routes');
const adminRoutes = require('./routes/admin.routes');
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

// Simple Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'UP', 
        message: 'KFintech Node.js Core Backend is fully operational.' 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 KFintech Nexus Server is running on port ${PORT}.`);
});
