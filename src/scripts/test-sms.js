const smsUtil = require('../utils/sms.util');

async function testStaticSms() {
    const phone = '79848210153';
    const otp = '123456';
    
    console.log(`Sending static OTP ${otp} to ${phone}...`);
    
    try {
        const result = await smsUtil.sendSms(phone, 'otp', { otp });
        console.log('Result:', result);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testStaticSms();
