/**
 * Utility for time-related operations.
 */

/**
 * Formats a Date or string to HH:mm:ss using UTC components.
 * This is essential for MSSQL TIME columns which Sequelize treats as UTC.
 * @param {Date|string} t Time to format
 * @returns {string} Formatted time string
 */
const formatTimeToHHMMSS = (t) => {
    if (!t) return null;
    
    if (t instanceof Date) {
        // Use UTC components to avoid timezone shift on abstract TIME values
        const h = String(t.getUTCHours()).padStart(2, '0');
        const m = String(t.getUTCMinutes()).padStart(2, '0');
        const s = String(t.getUTCSeconds()).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }
    
    if (typeof t === 'string') {
        // If it's already a string but has more than 8 chars (e.g. ISO date), 
        // try to extract the time part.
        if (t.includes('T')) {
            return t.split('T')[1].split('.')[0];
        }
        // If it's something like "20:30:00.0000000", take first 8 chars
        return t.split('.')[0];
    }
    
    return t;
};

module.exports = { formatTimeToHHMMSS };
