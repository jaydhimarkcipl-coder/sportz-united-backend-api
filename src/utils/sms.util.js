// Using global fetch (available in Node.js 18+)

class SmsUtil {
    constructor() {
        this.baseUrl = 'https://pgapi.smartping.io/fe/api/v1/send';
        this.config = {
            username: 'Uniserve.trans',
            password: '5I4j3',
            from: 'unsopl',
            dltPrincipalEntityId: '1701176908573663236'
        };

        // Template specific DLT Content IDs
        this.templates = {
            otp: {
                dltContentId: '1707177080002286553',
                message: (otp) => `${otp} is the OTP for verification. This OTP is valid for 10 minutes. Please do not share it with anyone. Team Uniserve`
            },
            reminder: {
                dltContentId: '1707177080002286553', // Placeholder - must replace with approved DLT ID
                message: (data) => `Reminder: Your booking at ${data.arenaName} starts in 40 minutes. Get ready! Team Uniserve` 
            },
            post_match: {
                dltContentId: '1707177080002286553', // Placeholder - must replace with approved DLT ID
                message: (data) => `We hope you enjoyed your time at ${data.arenaName}. Please leave a review! Team Uniserve` 
            }
        };
    }

    async sendSms(to, templateKey, templateData = {}) {
        try {
            const template = this.templates[templateKey];
            if (!template) {
                throw new Error(`Template ${templateKey} not found`);
            }

            let text = '';
            if (templateKey === 'otp') {
                text = template.message(templateData.otp || '');
            } else {
                text = template.message(templateData);
            }
            const phone = to.startsWith('91') ? to : `91${to}`;

            const params = new URLSearchParams({
                unicode: 'false',
                username: this.config.username,
                password: this.config.password,
                messageType: 'text',
                to: phone,
                from: this.config.from,
                dltContentId: template.dltContentId,
                dltPrincipalEntityId: this.config.dltPrincipalEntityId,
                text: text
            });

            const url = `${this.baseUrl}?${params.toString()}`;

            console.log(`Sending SMS to ${phone} using template ${templateKey}...`);

            const response = await fetch(url);
            const result = await response.text(); // The API seems to return text based on the URL example

            console.log(`SMS Gateway Response: ${result}`);

            return result;
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }
}

module.exports = new SmsUtil();
