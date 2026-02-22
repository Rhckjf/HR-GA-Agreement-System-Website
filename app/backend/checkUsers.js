require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGO_URL, { dbName: process.env.DB_NAME });
    console.log('Connected to:', process.env.DB_NAME);

    const users = await mongoose.connection.collection('users').find({}).toArray();
    console.log(`Total users: ${users.length}`);
    users.forEach(u => {
        console.log(`  - ${u.email} | role: ${u.role} | dept: ${u.department} | hasPwd: ${!!u.password_hash}`);
    });

    await mongoose.disconnect();
}

main().catch(console.error);
