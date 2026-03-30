/**
 * Utility to convert relative image paths to absolute URLs.
 * Uses BASE_URL from the environment.
 */
const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    // Ensure BASE_URL exists and doesn't end with a slash, 
    // and path starts with a slash.
    const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const relativePath = path.startsWith('/') ? path : `/${path}`;
    
    return `${baseUrl}${relativePath}`;
};

module.exports = { getFullUrl };
