const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' }); // or whichever loads it
const Agreement = require('../models/agreement');
const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');

const seedDummyAgreements = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/hrga', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected for Seeding');

        // Fetch an admin id to assign as created_by
        const admin = await User.findOne({ role: 'admin' });
        const createdBy = admin ? admin.id : uuidv4();

        const now = new Date();
        const addDays = (days) => {
            const date = new Date(now);
            date.setDate(date.getDate() + days);
            return date.toISOString();
        };

        const dummies = [
            // Sales
            { title: 'Sales Contract - 3 Months', dept: 'Sales', vendor: 'PT Alpha', days: 85 },
            { title: 'Sales Contract - 2 Months', dept: 'Sales', vendor: 'PT Beta', days: 50 },
            { title: 'Sales Contract - 1 Month', dept: 'Sales', vendor: 'PT Gamma', days: 15 },
            { title: 'Sales Contract - Expired', dept: 'Sales', vendor: 'PT Delta', days: -5 },
            
            // Purchasing
            { title: 'Purchasing Vendor A - 3 Months', dept: 'Purchasing', vendor: 'CV Kencana', days: 89 },
            { title: 'Purchasing Vendor B - 1 Month', dept: 'Purchasing', vendor: 'CV Maju Jaya', days: 28 },
            { title: 'Purchasing Vendor C - Expired', dept: 'Purchasing', vendor: 'Toko Abadi', days: -1 },
        ];

        for (const data of dummies) {
            const expiryStr = addDays(data.days);
            // Delete if already exist visually by simple name
            await Agreement.deleteOne({ title: data.title });

            await Agreement.create({
                id: uuidv4(),
                title: data.title,
                vendor_id: 'VEND-001',
                vendor_name: data.vendor,
                category: data.dept === 'Sales' ? 'Sales Agreement' : 'Purchase/Vendor Agreement',
                start_date: addDays(-10), // started 10 days ago
                expiry_date: expiryStr,
                status: data.days <= 0 ? 'expired' : 'active',
                approval_status: 'approved',
                department: data.dept,
                created_by: createdBy
            });
            console.log(`Created: ${data.title} (${data.days} days remaining)`);
        }

        console.log('Dummy formatting generated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding pseudo agreements:', error);
        process.exit(1);
    }
};

seedDummyAgreements();
