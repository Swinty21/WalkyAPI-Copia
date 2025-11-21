const cron = require('node-cron');
const emailService = require('./emailService');
const db = require('../config/database');

class NotificationScheduler {
    constructor() {
        this.jobs = [];
    }

    start() {
        console.log('🚀 Starting notification scheduler...');

        this.jobs.push(
            cron.schedule('*/2 * * * *', async () => {
                console.log('⏰ Running email queue processor...');
                try {
                    await emailService.processEmailQueue();
                } catch (error) {
                    console.error('Error in email queue job:', error);
                }
            })
        );

        this.jobs.push(
            cron.schedule('0 9 * * *', async () => {
                console.log('⏰ Checking expiring subscriptions...');
                try {
                    await db.query('CALL sp_notify_expiring_subscriptions()');
                    console.log('✅ Subscription notifications created');
                } catch (error) {
                    console.error('Error in subscription job:', error);
                }
            })
        );

        this.jobs.push(
            cron.schedule('0 2 * * 0', async () => {
                console.log('⏰ Cleaning old notifications...');
                try {
                    const result = await db.query(`
                        DELETE FROM notifications 
                        WHERE is_read = 1 
                        AND email_sent = 1
                        AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
                    `);
                    console.log(`✅ Cleaned ${result.affectedRows} old notifications`);
                } catch (error) {
                    console.error('Error cleaning notifications:', error);
                }
            })
        );

        console.log(`✅ ${this.jobs.length} notification jobs scheduled`);
    }

    stop() {
        console.log('🛑 Stopping notification scheduler...');
        this.jobs.forEach(job => job.stop());
        this.jobs = [];
    }
}

module.exports = new NotificationScheduler();