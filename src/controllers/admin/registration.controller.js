const registrationService = require('../../services/admin/registration.service');

class RegistrationController {
    async exportRegistrations(req, res, next) {
        try {
            const excelBuffer = await registrationService.exportRegistrations(req.query);
            
            const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
            const filename = `Registration_List_${timestamp}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            
            return res.send(excelBuffer);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RegistrationController();
