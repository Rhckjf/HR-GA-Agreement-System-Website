const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const Agreement = require('../models/agreement');
const User = require('../models/user');
const DepartmentSettings = require('../models/departmentSettings');
const Notification = require('../models/notification');
const { calculateAgreementStatus } = require('./status');
const { sendEmail } = require('./mailer');

const checkExpiryAndNotify = async () => {
    try {
        console.log('[CRON] Starting daily agreement expiry check...');
        const agreements = await Agreement.find({
            $or: [
                { notified_3m: false },
                { notified_2m: false },
                { notified_1m: false },
                { notified_expired: false }
            ]
        });

        const departmentBuckets = {};

        // Fetch admin user and admin email config
        const adminUser = await User.findOne({ role: 'admin' });
        const adminConfig = await DepartmentSettings.findOne({ department: 'Admin' });
        let adminEmails = [];
        if (adminConfig && adminConfig.emails) {
            adminEmails = adminConfig.emails.filter(e => e.trim() !== '');
        }

        const now = new Date();
        now.setHours(0,0,0,0);

        for (const agreement of agreements) {
            const expiryDate = new Date(agreement.expiry_date);
            expiryDate.setHours(0,0,0,0);
            
            const diffTime = expiryDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const dept = agreement.origin_department || agreement.department || 'Unknown';
            let bucket = null;

            if (diffDays <= 90 && diffDays > 60 && !agreement.notified_3m) {
                bucket = '3m';
                agreement.notified_3m = true;
            } else if (diffDays <= 60 && diffDays > 30 && !agreement.notified_2m) {
                bucket = '2m';
                agreement.notified_2m = true;
                agreement.notified_3m = true;
            } else if (diffDays <= 30 && diffDays > 0 && !agreement.notified_1m) {
                bucket = '1m';
                agreement.notified_1m = true;
                agreement.notified_2m = true;
                agreement.notified_3m = true;
            } else if (diffDays <= 0 && !agreement.notified_expired) {
                bucket = 'expired';
                agreement.notified_expired = true;
                agreement.notified_1m = true;
                agreement.notified_2m = true;
                agreement.notified_3m = true;
            }

            if (bucket) {
                if (!departmentBuckets[dept]) {
                    departmentBuckets[dept] = { '3m': [], '2m': [], '1m': [], 'expired': [] };
                }
                departmentBuckets[dept][bucket].push(agreement);
            }
        }

        const depts = Object.keys(departmentBuckets);
        if (depts.length === 0) {
            console.log('[CRON] No agreements crossed milestones today.');
            return;
        }

        for (const dept of depts) {
            const buckets = departmentBuckets[dept];
            const allDeptAgreements = [...buckets['3m'], ...buckets['2m'], ...buckets['1m'], ...buckets['expired']];
            if (allDeptAgreements.length === 0) continue;

            console.log(`[CRON] Compiling digest for department: ${dept}`);

            let deptEmails = [];
            const deptConfig = await DepartmentSettings.findOne({ department: dept });
            if (deptConfig && deptConfig.emails) {
                deptEmails = deptConfig.emails.filter(e => e.trim() !== '');
            }

            const recipients = [];
            for (const email of deptEmails) {
                if (email && !recipients.find(r => r.email === email)) {
                    recipients.push({ id: `dept-email-${uuidv4()}`, name: `${dept} Staff`, email });
                }
            }
            for (const email of adminEmails) {
                if (email && !recipients.find(r => r.email === email)) {
                    recipients.push({ id: `admin-email-${uuidv4()}`, name: 'Admin', email });
                }
            }
            if (recipients.length === 0 && adminUser && adminUser.email) {
                recipients.push(adminUser);
            }

            let html = `<h2>Agreement Validity Report - ${dept}</h2>`;
            html += `<p>Hello,</p><p>This is your consolidated report of agreements approaching expiry or already expired.</p>`;

            const generateTable = (title, items) => {
                if (items.length === 0) return '';
                let tableHtml = `<h3 style="margin-top: 1.5rem; color: #374151;">${title}</h3>`;
                tableHtml += `<table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 14px;">
                                <thead>
                                    <tr style="background-color: #f3f4f6;">
                                        <th style="padding: 10px; text-align: left;">Title</th>
                                        <th style="padding: 10px; text-align: left;">Vendor</th>
                                        <th style="padding: 10px; text-align: left;">Category</th>
                                        <th style="padding: 10px; text-align: left;">Expiry Date</th>
                                    </tr>
                                </thead>
                                <tbody>`;
                for (const item of items) {
                    tableHtml += `<tr>
                                    <td style="padding: 10px;">${item.title}</td>
                                    <td style="padding: 10px;">${item.vendor_name || '-'}</td>
                                    <td style="padding: 10px;">${item.category}</td>
                                    <td style="padding: 10px; color: ${title.includes('EXPIRED') ? 'red' : 'black'}; font-weight: 500;">
                                        ${new Date(item.expiry_date).toLocaleDateString()}
                                    </td>
                                  </tr>`;
                }
                tableHtml += `</tbody></table>`;
                return tableHtml;
            };

            html += generateTable('Expiring in ~3 Months (<= 90 Days)', buckets['3m']);
            html += generateTable('Expiring in ~2 Months (<= 60 Days)', buckets['2m']);
            html += generateTable('Expiring in ~1 Month (<= 30 Days)', buckets['1m']);
            html += generateTable('⚠️ EXPIRED (Action Required)', buckets['expired']);

            html += `<p style="margin-top:20px;">Thank you,<br>HR-GA Agreement System</p>`;
            const subject = `[Notification] Agreement Expiry Digest - ${dept}`;

            for (const user of recipients) {
                if (!user.email) continue;
                await sendEmail(user.email, subject, html);
                
                for (const item of allDeptAgreements) {
                    let msg = `Agreement '${item.title}' is expiring soon.`;
                    let type = 'expiry_warning';
                    if (buckets['expired'].includes(item)) { 
                        msg = `Agreement '${item.title}' has expired!`; 
                        type = 'expired'; 
                    }
                    await Notification.create({
                        id: uuidv4(),
                        user_id: user.id,
                        agreement_id: item.id,
                        agreement_title: item.title,
                        message: msg + ` (Expiry Date: ${new Date(item.expiry_date).toLocaleDateString()}).`,
                        type: type,
                        is_read: false,
                        created_at: new Date().toISOString()
                    });
                }
            }
            
            // Save the items
            for (const item of allDeptAgreements) {
                await item.save();
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
    setTimeout(checkExpiryAndNotify, 5000); 

    console.log('[CRON] Cron jobs initialized.');
};

module.exports = {
    initCronJobs,
    checkExpiryAndNotify // Exported for manual testing if needed
};
