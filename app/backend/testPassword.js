require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
    await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });

    const admin = await mongoose.connection.collection('users').findOne({ email: 'admin@company.com' });
    if (!admin) {
        console.log('❌ Admin user NOT FOUND in DB!');
        await mongoose.disconnect();
        return;
    }

    console.log('✅ Admin found:', admin.email, '| role:', admin.role);
    const match = await bcrypt.compare('Admin123!', admin.password_hash);
    console.log('Password match:', match ? '✅ YES' : '❌ NO');

    await mongoose.disconnect();
}

main().catch(console.error);
