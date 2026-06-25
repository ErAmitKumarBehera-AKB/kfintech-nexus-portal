const InvestorProfile = require('../models/InvestorProfile');
const Nominee = require('../models/Nominee');

exports.getProfile = async (req, res) => {
    try {
        console.log("req.user decoded is:", req.user);
        const userId = req.user.userId;
        
        let profile = await InvestorProfile.findOne({ userId });
        
        if (!profile) {
            // Should be created during registration, but fallback just in case
            profile = new InvestorProfile({ userId, fullName: `Investor_${userId.toString().substring(0, 5)}` });
            await profile.save();
        }

        const nominees = await Nominee.find({ investorProfileId: profile._id });

        return res.status(200).json({
            profile,
            nominees
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ message: "Failed to fetch profile data." });
    }
};

exports.syncFromInternet = async (req, res) => {
    try {
        const userId = req.user.userId;
        let profile = await InvestorProfile.findOne({ userId });
        
        if (!profile) {
            profile = new InvestorProfile({ userId });
        }

        // Mock "Internet Fetch" from Gov Databases
        const mockFirstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sai', 'Ananya', 'Diya', 'Ishita', 'Kavya'];
        const mockLastNames = ['Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Rao', 'Desai'];
        
        const randomName = () => `${mockFirstNames[Math.floor(Math.random() * mockFirstNames.length)]} ${mockLastNames[Math.floor(Math.random() * mockLastNames.length)]}`;
        
        profile.fullName = randomName();
        profile.dateOfBirth = new Date(1980 + Math.floor(Math.random() * 20), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));
        
        // Generate random PAN (5 letters, 4 numbers, 1 letter)
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const randomString = (length) => Array.from({length}, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
        const numbers = "0123456789";
        const randomNumberStr = (length) => Array.from({length}, () => numbers.charAt(Math.floor(Math.random() * numbers.length))).join('');
        
        profile.panNumber = `${randomString(5)}${randomNumberStr(4)}${randomString(1)}`;
        profile.aadharNumber = `${randomNumberStr(4)} ${randomNumberStr(4)} ${randomNumberStr(4)}`;
        
        profile.address = {
            street: `${Math.floor(Math.random() * 100) + 1} Main Street, Block ${randomString(1)}`,
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            country: 'India'
        };

        profile.bankDetails = {
            accountNumber: randomNumberStr(12),
            ifscCode: `HDFC000${randomNumberStr(4)}`,
            bankName: 'HDFC Bank Ltd.'
        };

        await profile.save();

        // Sync a Nominee
        await Nominee.deleteMany({ investorProfileId: profile._id }); // Clear existing mocks
        
        const nominee = new Nominee({
            investorProfileId: profile._id,
            fullName: randomName(),
            relationship: 'Spouse',
            allocationPercentage: 100,
            dateOfBirth: new Date(1985 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            panNumber: `${randomString(5)}${randomNumberStr(4)}${randomString(1)}`
        });

        await nominee.save();

        return res.status(200).json({
            message: "Successfully synchronized KYC and Nominee data from Gov Database.",
            profile,
            nominees: [nominee]
        });

    } catch (error) {
        console.error("Error syncing profile:", error);
        return res.status(500).json({ message: "Failed to sync data from internet." });
    }
};
