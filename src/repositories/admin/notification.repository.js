const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../../data');
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}
const notifFile = path.join(dataPath, 'notifications.json');

class NotificationRepository {
    constructor() {
        if (!fs.existsSync(notifFile)) {
            fs.writeFileSync(notifFile, JSON.stringify([]));
        }
    }

    _readData() {
        const raw = fs.readFileSync(notifFile);
        return JSON.parse(raw);
    }

    _writeData(data) {
        fs.writeFileSync(notifFile, JSON.stringify(data, null, 2));
    }

    sendNotification(senderId, payload) {
        const data = this._readData();
        const notification = {
            id: Date.now().toString(),
            senderId,
            ...payload,
            sentAt: new Date().toISOString()
        };
        data.push(notification);
        this._writeData(data);
        return notification;
    }

    getNotificationsBySender(senderId) {
        const data = this._readData();
        // Return only notifications instantiated by this staff/admin
        return data.filter(n => n.senderId === senderId);
    }
}

module.exports = new NotificationRepository();
