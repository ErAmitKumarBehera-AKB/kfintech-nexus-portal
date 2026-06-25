require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Setup MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/kfintech_nexus?directConnection=true';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Successfully connected to MongoDB Database.');
        
        // --- START AUTOMATED INITIALIZATION ---
        try {
            console.log('🔄 Initializing system dependencies...');
            
            try {
                await mongoose.connection.db.admin().command({ replSetInitiate: {} });
                console.log("🗄️ MongoDB Replica Set Initialized automatically!");
                // Wait 2 seconds for primary election
                await new Promise(r => setTimeout(r, 2000));
            } catch(e) {
                if (e.codeName === 'AlreadyInitialized') {
                    // Ignore already initialized
                } else {
                    console.log("🗄️ Replica Set init note:", e.message);
                }
            }
            
            // 1. Seed dummy user so Investor has a mock Email & SMS
            require('./seed_user'); 
            
            // 2. Initialize AWS LocalStack (S3 Bucket, SES Verification)
            require('./test_localstack');
            
        } catch (initErr) {
            console.log('⚠️ Non-critical warning during initialization:', initErr.message);
        }
        // --- END AUTOMATED INITIALIZATION ---
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Register all Mongoose models so .populate() works correctly
require('./models/User');
require('./models/Notification');

// Route setup
const authRoutes = require('./routes/auth.routes');
const ticketRoutes = require('./routes/ticket.routes');
const adminRoutes = require('./routes/admin.routes');
const l1Routes = require('./routes/l1.routes');
const l2Routes = require('./routes/l2.routes');
const chatRoutes = require('./routes/chat.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/l1', l1Routes);
app.use('/api/l2', l2Routes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

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
