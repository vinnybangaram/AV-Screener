const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: to,
      subject: subject,
      html: html,
    });
    console.log('✉️ [Email] Sent successfully:', data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('❌ [Email] Send failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
