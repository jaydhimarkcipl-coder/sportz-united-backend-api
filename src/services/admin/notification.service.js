const notificationRepo = require('../../repositories/admin/notification.repository');

class AdminNotificationService {
    async sendNotification(data, currentUserId) {
        // Here we could integrate AWS SNS, Twilio, or FCM
        // We'll log it in our mock repo
        return notificationRepo.sendNotification(currentUserId, data);
    }

    async getSentNotifications(currentUserId) {
        return notificationRepo.getNotificationsBySender(currentUserId);
    }
}

module.exports = new AdminNotificationService();
