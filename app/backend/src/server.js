const app = require('./app');
const connectDB = require('./config/db');
const seedUsers = require('./utils/seed');

const PORT = process.env.PORT || 8001;

// Connect to database
connectDB().then(async () => {
    // Seed data
    await seedUsers();

    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
});
