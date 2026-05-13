/**
 * Generates a unique tournament code
 * @param {string} prefix - Optional prefix for the code
 * @returns {string} - Generated code (e.g. TRN-A1B2)
 */
const generateTournamentCode = (prefix = 'TRN') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid O, 0, I, 1
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${result}`;
};

module.exports = { generateTournamentCode };
