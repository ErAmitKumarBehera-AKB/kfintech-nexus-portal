const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Use the already-registered User model if available (server.js registers it first),
// otherwise define a minimal schema for standalone execution.
let User;
try {
    User = mongoose.model('User');
} catch (e) {
    const UserSchema = new mongoose.Schema({
        name: String,
        email: { type: String, unique: true, lowercase: true, trim: true },
        passwordHash: String,
        phoneNumber: String,
        role: { type: String, enum: ['INVESTOR', 'ADMIN_L1', 'ADMIN_L2', 'ADMIN_SUPER'], default: 'INVESTOR' },
        isActive: { type: Boolean, default: true }
    }, { collection: 'users' });
    User = mongoose.model('User', UserSchema);
}

const DEMO_PASSWORD = 'KFintech@2026';
const SALT_ROUNDS = 10;

const DEMO_USERS = [
    {
        _id: new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a00'),
        name: 'Amit Behera',
        email: 'investor@kfintech.com',
        phoneNumber: '+911234567890',
        role: 'INVESTOR',
        isActive: true
    },
    {
        _id: new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a01'),
        name: 'Priya Sharma',
        email: 'l1agent@kfintech.com',
        phoneNumber: '+911234567891',
        role: 'ADMIN_L1',
        isActive: true
    },
    {
        _id: new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a02'),
        name: 'Ashutosh',
        email: 'l2agent@kfintech.com',
        phoneNumber: '+911234567892',
        role: 'ADMIN_L2',
        isActive: true
    },
    {
        _id: new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a03'),
        name: 'Soubhagya Pratik',
        email: 'admin@kfintech.com',
        phoneNumber: '+911234567893',
        role: 'ADMIN_SUPER',
        isActive: true
    },
    {
        _id: new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a04'),
        name: 'John Doe',
        email: 'john@kfintech.com',
        phoneNumber: '+911111111111',
        role: 'INVESTOR',
        isActive: true
    },
    {
        _id: new mongoose.Types.ObjectId('60d5ecb8b392d700153f3a05'),
        name: 'Jane Smith',
        email: 'jane@kfintech.com',
        phoneNumber: '+919999999999',
        role: 'INVESTOR',
        isActive: true
    }
];

async function seedUsers() {
    try {
        const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

        for (const userData of DEMO_USERS) {
            await User.findOneAndUpdate(
                { _id: userData._id },
                {
                    $set: {
                        name: userData.name,
                        email: userData.email,
                        passwordHash,
                        phoneNumber: userData.phoneNumber,
                        role: userData.role,
                        isActive: userData.isActive
                    }
                },
                { upsert: true, new: true }
            );
            console.log(`✅ Seeded user: ${userData.email} [${userData.role}]`);
        }

        console.log('\n📋 Demo Credentials (all use password: KFintech@2026)');
        console.log('  investor@kfintech.com  → INVESTOR');
        console.log('  l1agent@kfintech.com   → ADMIN_L1');
        console.log('  l2agent@kfintech.com   → ADMIN_L2');
        console.log('  admin@kfintech.com     → ADMIN_SUPER\n');

    } catch (err) {
        console.error('⚠️ User seed error (non-fatal):', err.message);
    }
}

// When required by server.js: just run and resolve (no process.exit)
// When run directly: connect, seed, then exit
if (require.main === module) {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27018/kfintech_nexus?directConnection=true';
    mongoose.connect(MONGODB_URI)
        .then(() => seedUsers())
        .then(() => process.exit(0))
        .catch(err => { console.error(err); process.exit(1); });
} else {
    // Called from server.js after mongoose is already connected
    seedUsers();
}

module.exports = seedUsers;
