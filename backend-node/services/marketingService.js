const { Resend } = require('resend');
const admin = require('firebase-admin');
const db = require('../db/client');

class MarketingService {
    constructor() {
        if (process.env.RESEND_API_KEY) {
            this.resend = new Resend(process.env.RESEND_API_KEY);
        }
        
        if (process.env.FIREBASE_CREDENTIALS) {
            const cert = JSON.parse(process.env.FIREBASE_CREDENTIALS);
            admin.initializeApp({
                credential: admin.credential.cert(cert)
            });
        }
    }

    /**
     * Onboarding Email
     */
    async sendWelcomeEmail(email, name) {
        if (!this.resend) return;
        await this.resend.emails.send({
            from: 'AV Screener <hello@avscreener.com>',
            to: email,
            subject: 'Welcome to Elite Trading Strategy!',
            html: `<h1>Hi ${name},</h1><p>Your journey to professional NSE screening starts now. Your premium trial is active.</p>`
        });
    }

    /**
     * Referral Tracking
     */
    async trackReferral(referrerId, referredId) {
        await db.query(`
            INSERT INTO referrals (referrer_id, referred_id, status)
            VALUES ($1, $2, 'PENDING')
            ON CONFLICT DO NOTHING
        `, [referrerId, referredId]);
    }

    /**
     * Push Notifications (Firebase)
     */
    async sendPushNotification(fcmToken, title, body) {
        if (!admin.apps.length) return;
        const message = {
            notification: { title, body },
            token: fcmToken
        };
        await admin.messaging().send(message);
    }

    async logUserActivity(userId, eventType, metadata = {}) {
        await db.query('INSERT INTO user_activity_logs (user_id, event_type, metadata) VALUES ($1, $2, $3)', 
            [userId, eventType, JSON.stringify(metadata)]);
    }
}

module.exports = new MarketingService();
