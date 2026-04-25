const Razorpay = require('razorpay');
const db = require('../db/client');
const crypto = require('crypto');

class FinancialService {
    constructor() {
        if (process.env.RAZORPAY_KEY_ID) {
            this.razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            });
        }
    }

    async createSubscription(userId, planId, couponCode = null) {
        // 1. Fetch Plan
        const { rows: [plan] } = await db.query('SELECT * FROM plans WHERE id = $1', [planId]);
        if (!plan) throw new Error('Invalid Plan');

        let amount = plan.amount_paise;

        // 2. Apply Coupon
        if (couponCode) {
            const { rows: [coupon] } = await db.query(
                'SELECT * FROM coupons WHERE code = $1 AND is_active = TRUE AND valid_until > NOW()', 
                [couponCode]
            );
            if (coupon) {
                amount = amount * (1 - (coupon.discount_percent / 100));
            }
        }

        // 3. Create Razorpay Subscription
        const rzpSub = await this.razorpay.subscriptions.create({
            plan_id: plan.price_id,
            customer_notify: 1,
            total_count: 12, // Monthly for a year
            notes: { userId, amount }
        });

        // 4. Save to DB
        await db.query(`
            INSERT INTO subscriptions (user_id, plan_id, status, razorpay_sub_id, current_period_end)
            VALUES ($1, $2, $3, $4, $5)
        `, [userId, planId, 'pending', rzpSub.id, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);

        return rzpSub;
    }

    async verifyWebhook(body, signature) {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
            .update(JSON.stringify(body))
            .digest('hex');
            
        if (expectedSignature !== signature) throw new Error('Invalid Webhook Signature');

        const { event, payload } = body;
        if (event === 'subscription.activated') {
            const rzpSubId = payload.subscription.entity.id;
            await db.query('UPDATE subscriptions SET status = $1 WHERE razorpay_sub_id = $2', ['active', rzpSubId]);
        }
    }

    async getPremiumStatus(userId) {
        const { rows: [sub] } = await db.query(`
            SELECT p.name, s.status, s.current_period_end 
            FROM subscriptions s 
            JOIN plans p ON s.plan_id = p.id 
            WHERE s.user_id = $1 AND s.status = 'active' AND s.current_period_end > NOW()
        `, [userId]);
        return sub || { name: 'FREE', status: 'none' };
    }
}

module.exports = new FinancialService();
