const DepartmentSettings = require('../models/departmentSettings');

exports.getAllSettings = async (req, res) => {
    try {
        const settings = await DepartmentSettings.find();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching department settings:', error);
        res.status(500).json({ detail: 'Failed to fetch settings' });
    }
};

exports.getSettingsByDepartment = async (req, res) => {
    try {
        const { department } = req.params;
        const settings = await DepartmentSettings.findOne({ department });
        if (!settings) {
            return res.json({ department, emails: [] });
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching department settings:', error);
        res.status(500).json({ detail: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { department } = req.params;
        const { emails } = req.body; // Expect an array of emails

        if (!Array.isArray(emails)) {
            return res.status(400).json({ detail: 'Emails must be an array' });
        }

        // Limit to 5 emails max based on requirement
        const sanitizedEmails = emails.slice(0, 5).filter(e => typeof e === 'string' && e.trim() !== '');

        const settings = await DepartmentSettings.findOneAndUpdate(
            { department },
            { department, emails: sanitizedEmails },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        console.error('Error updating department settings:', error);
        res.status(500).json({ detail: 'Failed to update settings' });
    }
};
