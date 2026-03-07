const Agreement = require('../models/agreement');
const Vendor = require('../models/vendor');
const { calculateAgreementStatus } = require('../utils/status');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const { department } = req.query;
        let query = {};

        // If not admin, force their own department
        if (req.user.role !== 'admin' && req.user.department) {
            query.department = req.user.department;
        } else if (department) {
            // Admin requesting a specific department
            query.department = department;
        }

        const allAgreements = await Agreement.find(query).lean();

        let activeCount = 0;
        let expiringSoonCount = 0;
        let expiredCount = 0;

        let distExpired = 0;
        let distSoon1Month = 0;
        let dist1_3Months = 0;
        let dist3_6Months = 0;
        let dist6_12Months = 0;
        let distActiveOver1Year = 0;

        const now = new Date();

        allAgreements.forEach(agreement => {
            const status = calculateAgreementStatus(agreement.expiry_date);
            if (status === 'active') activeCount++;
            else if (status === 'expiring_soon') expiringSoonCount++;
            else if (status === 'expired') expiredCount++;

            try {
                const expiryDate = new Date(agreement.expiry_date);
                const diffTime = expiryDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                    distExpired++;
                } else if (diffDays <= 30) {
                    distSoon1Month++;
                } else if (diffDays <= 90) {
                    dist1_3Months++;
                } else if (diffDays <= 180) {
                    dist3_6Months++;
                } else if (diffDays <= 365) {
                    dist6_12Months++;
                } else {
                    distActiveOver1Year++;
                }
            } catch (e) {
                console.error(`Error calculating distribution for date ${agreement.expiry_date}: ${e}`);
                if (status === 'expired') distExpired++;
                else if (status === 'expiring_soon') distSoon1Month++;
                else distActiveOver1Year++;
            }
        });

        // Determine vendor filter based on department
        let vendorQuery = {};
        const getVendorTypeByDept = (d) => {
            if (d === 'Sales') return ['customer'];
            if (d === 'Purchasing') return ['vendor'];
            if (d === 'PPIC') return ['barang', 'jasa', 'forwarder'];
            return [];
        };

        const currentDept = query.department;
        if (currentDept) {
            vendorQuery.type = { $in: getVendorTypeByDept(currentDept) };
        }

        const totalVendors = await Vendor.countDocuments(vendorQuery);

        res.json({
            total_agreements: allAgreements.length,
            active_agreements: activeCount,
            expiring_soon: expiringSoonCount,
            expired_agreements: expiredCount,
            total_vendors: totalVendors,
            expiry_distribution: {
                active_over_1_year: distActiveOver1Year,
                expiring_6_12_months: dist6_12Months,
                expiring_3_6_months: dist3_6Months,
                expiring_1_3_months: dist1_3Months,
                expiring_soon_1_month: distSoon1Month,
                expired: distExpired
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
