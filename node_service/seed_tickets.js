const mongoose = require('mongoose');
require('dotenv').config();

// Attempt to load existing model or define it
let Ticket;
try {
    Ticket = mongoose.model('Ticket');
} catch (e) {
    Ticket = require('./models/Ticket');
}

const DEMO_USERS = [
    { _id: '60d5ecb8b392d700153f3a00', name: 'Amit Behera', acc: '9876543210' },
    { _id: '60d5ecb8b392d700153f3a01', name: 'Priya Sharma', acc: '1122334455' },
    { _id: '60d5ecb8b392d700153f3a04', name: 'John Doe', acc: '1111111111' },
    { _id: '60d5ecb8b392d700153f3a05', name: 'Jane Smith', acc: '9999999999' }
];

const COMPLAINT_TEXTS = [
    "Unable to process dividend update to my new bank account.",
    "My KYC is failing despite submitting correct documents.",
    "Address update request not processed after 2 weeks.",
    "Nominee name is spelled incorrectly in the records.",
    "My balance is showing incorrectly for mutual funds.",
    "Need to update my registered mobile number.",
    "Email not receiving OTPs."
];

const SERVICE_TYPES = ['COMPLAINT', 'BANK_UPDATE', 'NOMINEE_UPDATE', 'ADDRESS_UPDATE', 'EMAIL_UPDATE', 'MOBILE_UPDATE', 'KYC_UPDATE'];

const STATUSES = ['OPEN', 'L1_REVIEW', 'L2_APPROVAL'];
const PRIORITIES = ['NORMAL', 'CRITICAL'];

async function seedTickets() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/kfintech_nexus?directConnection=true';
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to DB.");

        // Clear existing tickets if needed, but for demo we can just add
        // await Ticket.deleteMany({});
        
        let ticketsToInsert = [];

        for (let i = 0; i < 20; i++) {
            const user = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];
            const complaint = COMPLAINT_TEXTS[Math.floor(Math.random() * COMPLAINT_TEXTS.length)];
            const sType = SERVICE_TYPES[Math.floor(Math.random() * SERVICE_TYPES.length)];
            const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
            const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
            
            ticketsToInsert.push({
                investorId: new mongoose.Types.ObjectId(user._id),
                investorName: user.name,
                accountNumber: user.acc,
                complaintText: `[${sType}] ${complaint}`,
                serviceType: sType,
                status: status,
                assignedPriority: priority,
                aiSentimentScore: parseFloat((Math.random() * 2 - 1).toFixed(2)), // -1 to +1
                aiSummary: ["Auto-generated demo ticket summary."],
                documentName: sType !== 'COMPLAINT' ? "demo_document.png" : null,
            });
        }

        await Ticket.insertMany(ticketsToInsert);
        console.log(`✅ Successfully seeded ${ticketsToInsert.length} demo tickets.`);
    } catch (error) {
        console.error("⚠️ Error seeding tickets:", error);
    } finally {
        mongoose.disconnect();
    }
}

seedTickets();
