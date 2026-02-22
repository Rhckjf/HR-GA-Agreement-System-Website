const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { ALLOWED_DEPARTMENTS } = require('../controllers/authController');

const seedUsers = async () => {
    try {
        // Create admin
        const adminEmail = 'admin@company.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('Admin123!', salt);

            await User.create({
                id: uuidv4(),
                email: adminEmail,
                password_hash: passwordHash,
                name: 'Admin User',
                role: 'admin',
                department: null,
                created_at: new Date().toISOString()
            });
            console.log('Default admin user created: admin@company.com / Admin123!');
        }

        // Create department users
        for (const dept of ALLOWED_DEPARTMENTS) {
            const email = `${dept.toLowerCase()}@company.com`;
            const existingDeptUser = await User.findOne({ email });

            if (!existingDeptUser) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash('Dept123!', salt);

                await User.create({
                    id: uuidv4(),
                    email,
                    password_hash: passwordHash,
                    name: `${dept} User`,
                    role: 'staff',
                    department: dept,
                    created_at: new Date().toISOString()
                });
                console.log(`Default ${dept} user created: ${email} / Dept123!`);
            }
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
};

module.exports = seedUsers;
