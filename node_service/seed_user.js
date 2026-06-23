const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: String,
    phoneNumber: String,
    name: String,
    role: String
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function seedUser() {
    await mongoose.connect('mongodb://127.0.0.1:27018/kfintech_nexus?directConnection=true');
    const targetId = '60d5ecb8b392d700153f3a00';
    
    const user = await User.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(targetId) },
        { 
            $set: { 
                email: 'amit1@gmail.com', 
                phoneNumber: '+1234567890',
                name: 'Amit Behera',
                role: 'INVESTOR'
            } 
        },
        { upsert: true, new: true }
    );
    
    console.log("Seeded User:", user);
}

// Only execute directly if not required by another file
if (require.main === module) {
    seedUser().then(() => process.exit(0));
} else {
    seedUser();
}
module.exports = seedUser;
