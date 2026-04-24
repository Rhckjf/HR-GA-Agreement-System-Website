const app = require('./app');
const connectDB = require('./config/db');
const seedUsers = require('./utils/seed');
const { initCronJobs } = require('./utils/cronJobs');

const PORT = process.env.PORT || 8001;

// Connect to database
connectDB().then(async () => {
    // Seed data
    await seedUsers();

    // Initialize cron jobs for background tasks like notifications
    initCronJobs();

    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
});
