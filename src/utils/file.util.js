const fs = require('fs');
const path = require('path');

/**
 * Saves a base64 encoded image to the uploads directory.
 * @param {string} base64String - The full data URI (e.g. "data:image/jpeg;base64,xxxx")
 * @param {string} prefix - Filename prefix (e.g. "arena", "avatar")
 * @returns {string|null} - Relative path to the saved file (e.g. "uploads/arena-123.jpg") or null if failed
 */
const saveBase64Image = (base64String, prefix = 'img') => {
    if (!base64String || typeof base64String !== 'string') return null;

    // Check if it's a valid data URI
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return null; // Not a base64 string
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    
    // Determine extension
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('gif')) extension = 'gif';
    else if (contentType.includes('jpeg')) extension = 'jpg';
    else {
        // Try to extract from MIME type if not standard
        const parts = contentType.split('/');
        if (parts.length > 1) extension = parts[1];
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    try {
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
        return `uploads/${fileName}`;
    } catch (error) {
        console.error('Error saving base64 image:', error);
        return null;
    }
};

/**
 * Checks if a string is a base64 image data URI.
 */
const isBase64Image = (str) => {
    if (!str || typeof str !== 'string') return false;
    return str.startsWith('data:image/');
};

module.exports = {
    saveBase64Image,
    isBase64Image
};
