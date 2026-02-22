const calculateAgreementStatus = (expiryDateStr) => {
    try {
        const expiryDate = new Date(expiryDateStr);
        const now = new Date();

        // Calculate difference in days
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Python logic:
        // if days_until_expiry < 0: return "expired"
        // elif days_until_expiry <= 30: return "expiring_soon"
        // else: return "active"

        // Javascript date subtraction gives milliseconds. 
        // If expiry is in the past, diffTime is negative.

        // Note: Python's (date1 - date2).days returns the integer number of days.
        // It truncates towards zero for positive, and away from zero for negative? No, it's floor.
        // Let's stick to the logic:

        // If expiry is clearly in the past (< 0 days), expired.
        // If expiry is within 30 days from now, expiring_soon.

        if (diffTime < 0) {
            return "expired";
        } else if (diffDays <= 30) {
            return "expiring_soon";
        } else {
            return "active";
        }
    } catch (error) {
        console.error(`Error calculating status for date ${expiryDateStr}: ${error}`);
        return "active";
    }
};

module.exports = { calculateAgreementStatus };
