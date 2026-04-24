const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const Agreement = require('../models/agreement');
const User = require('../models/user');
const Notification = require('../models/notification');
const { calculateAgreementStatus } = require('./status');
const { sendEmail } = require('./mailer');

const checkExpiryAndNotify = async () => {
    try {
        console.log('[CRON] Starting daily agreement expiry check...');
        const agreements = await Agreement.find({
            // Only fetch agreements that haven't been fully notified
            $or: [
                { notified_expiring_soon: false },
                { notified_expired: false }
            ]
        });

        if (agreements.length === 0) {
            console.log('[CRON] No pending agreements to check.');
            return;
        }

        // Fetch admin user
        const adminUser = await User.findOne({ role: 'admin' });

        for (const agreement of agreements) {
            const currentStatus = calculateAgreementStatus(agreement.expiry_date);
            const dept = agreement.origin_department || agreement.department;
            
            // Fetch one user from the department
            let deptUser = null;
            if (dept) {
                deptUser = await User.findOne({ department: dept });
            }

            // Fallback to created_by user if no dept user found
            if (!deptUser && agreement.created_by) {
                deptUser = await User.findOne({ id: agreement.created_by });
            }

            const recipients = [];
            if (deptUser && deptUser.email) recipients.push(deptUser);
            if (adminUser && adminUser.email && (!deptUser || adminUser.email !== deptUser.email)) {
                recipients.push(adminUser);
            }

            if (currentStatus === 'expiring_soon' && !agreement.notified_expiring_soon) {
                console.log(`[CRON] Agreement ${agreement.title} is expiring soon.`);
                
                // Send notifications
                for (const user of recipients) {
                    // Create in-app notification
                    await Notification.create({
                        id: uuidv4(),
                        user_id: user.id,
                        agreement_id: agreement.id,
                        agreement_title: agreement.title,
                        message: `Agreement '${agreement.title}' is expiring soon (Expiry Date: ${new Date(agreement.expiry_date).toLocaleDateString()}).`,
                        type: 'expiry_warning',
                        is_read: false,
                        created_at: new Date().toISOString()
                    });

                    // Send email
                    const subject = `[Expiring Soon] Agreement: ${agreement.title}`;
                    const html = `
                        <h2>Agreement Expiring Soon</h2>
                        <p>Hello ${user.name},</p>
                        <p>This is a notification that the following agreement is expiring soon:</p>
                        <ul>
                            <li><strong>Title:</strong> ${agreement.title}</li>
                            <li><strong>Vendor:</strong> ${agreement.vendor_name || 'N/A'}</li>
                            <li><strong>Category:</strong> ${agreement.category}</li>
                            <li><strong>Expiry Date:</strong> ${new Date(agreement.expiry_date).toLocaleDateString()}</li>
                            <li><strong>Department:</strong> ${dept}</li>
                        </ul>
                        <p>Please review and take necessary actions.</p>
                        <p>Thank you,<br>HR-GA Agreement System</p>
                    `;
                    await sendEmail(user.email, subject, html);
                }

                // Update agreement
                agreement.notified_expiring_soon = true;
                await agreement.save();

            } else if (currentStatus === 'expired' && !agreement.notified_expired) {
                console.log(`[CRON] Agreement ${agreement.title} has expired.`);
                
                // Send notifications
                for (const user of recipients) {
                    // Create in-app notification
                    await Notification.create({
                        id: uuidv4(),
                        user_id: user.id,
                        agreement_id: agreement.id,
                        agreement_title: agreement.title,
                        message: `Agreement '${agreement.title}' has expired! (Expiry Date: ${new Date(agreement.expiry_date).toLocaleDateString()}).`,
                        type: 'expired',
                        is_read: false,
                        created_at: new Date().toISOString()
                    });

                    // Send email
                    const subject = `[EXPIRED] Agreement: ${agreement.title}`;
                    const html = `
                        <h2>Agreement Expired</h2>
                        <p>Hello ${user.name},</p>
                        <p>This is a critical notification that the following agreement <strong>has expired</strong>:</p>
                        <ul>
                            <li><strong>Title:</strong> ${agreement.title}</li>
                            <li><strong>Vendor:</strong> ${agreement.vendor_name || 'N/A'}</li>
                            <li><strong>Category:</strong> ${agreement.category}</li>
                            <li><strong>Expiry Date:</strong> ${new Date(agreement.expiry_date).toLocaleDateString()}</li>
                            <li><strong>Department:</strong> ${dept}</li>
                        </ul>
                        <p>Please take immediate action.</p>
                        <p>Thank you,<br>HR-GA Agreement System</p>
                    `;
                    await sendEmail(user.email, subject, html);
                }

                // Update agreement
                agreement.notified_expired = true;
                // If it transitioned from active directly to expired (e.g. short duration), mark expiring_soon as true as well so it doesn't trigger later
                agreement.notified_expiring_soon = true; 
                await agreement.save();
            }
        }
        console.log('[CRON] Daily agreement expiry check completed.');
    } catch (error) {
        console.error('[CRON] Error during expiry check:', error);
    }
};

const initCronJobs = () => {
    // Run every day at 01:00 AM
    cron.schedule('0 1 * * *', () => {
        checkExpiryAndNotify();
    });

    // Also run immediately on startup (for testing purposes, but usually you'd want to just wait for the schedule)
    // Also run immediately on startup (for testing purposes)
    // setTimeout(checkExpiryAndNotify, 5000); 

    console.log('[CRON] Cron jobs initialized.');
};

module.exports = {
    initCronJobs,
    checkExpiryAndNotify // Exported for manual testing if needed
};
