const adminNotifService = require('../../services/admin/notification.service');

class AdminNotificationController {
    async send(req, res, next) {
        try {
            const result = await adminNotifService.sendNotification(req.body, req.user.id);
            res.status(201).json({ success: true, message: 'Notification sent', data: result });
        } catch (error) {
            next(error);
        }
    }

    async getHistory(req, res, next) {
        try {
            const result = await adminNotifService.getSentNotifications(req.user.id);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminNotificationController();
