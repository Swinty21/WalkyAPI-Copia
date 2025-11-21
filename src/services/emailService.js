const nodemailer = require('nodemailer');
const db = require('../config/database');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async getUserSettings(userId) {
        try {
            const [settings] = await db.query(`
                SELECT 
                    notification_walk_status,
                    notification_announcements,
                    notification_subscription,
                    notification_messages,
                    notification_system_alerts
                FROM user_settings 
                WHERE user_id = ?
            `, [userId]);
            
            return settings || {
                notification_walk_status: true,
                notification_announcements: true,
                notification_subscription: true,
                notification_messages: true,
                notification_system_alerts: true
            };
        } catch (error) {
            console.error('Error getting user settings:', error);
            return null;
        }
    }

    async shouldSendEmail(userId, notificationType) {
        const settings = await this.getUserSettings(userId);
        if (!settings) return true; 

        const criticalNotifications = [
            'walker_registration', 
            'payment_confirmed', 
            'walk_cancelled',
        ];

        if (criticalNotifications.includes(notificationType)) {
            console.log(`📌 Critical notification: ${notificationType} - Always sent`);
            return true;
        }

        const typeToSettingMap = {
            'walk_requested': 'notification_walk_status',
            'walk_accepted': 'notification_walk_status',
            'walk_rejected': 'notification_walk_status',
            'walk_started': 'notification_walk_status',
            'walk_completed': 'notification_walk_status',
            
            'new_message': 'notification_messages',
            
            'new_review': 'notification_system_alerts',
            'review_updated': 'notification_system_alerts',
            'ticket_response': 'notification_system_alerts',
            
            'new_banner': 'notification_announcements',
            
            'subscription_expiring': 'notification_subscription',
            'subscription_renewed': 'notification_subscription',
        };

        const settingField = typeToSettingMap[notificationType] || 'notification_system_alerts';
        const isEnabled = settings[settingField] === 1 || settings[settingField] === true;
        
        if (!isEnabled) {
            console.log(`⚙️ User ${userId} has ${notificationType} (${settingField}) disabled`);
        }
        
        return isEnabled;
    }

    getEmailTemplate(notification, user) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .notification-badge { display: inline-block; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
        .success { background-color: #4CAF50; color: white; }
        .warning { background-color: #FF9800; color: white; }
        .info { background-color: #2196F3; color: white; }
        .error { background-color: #F44336; color: white; }
        .message { font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .footer a { color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐾 Walky</h1>
        </div>
        <div class="content">
            <span class="notification-badge ${notification.type}">
                ${notification.type.toUpperCase()}
            </span>
            <h2>${notification.title}</h2>
            <div class="message">${notification.content}</div>
            <a href="${process.env.FRONTEND_URL || 'https://walky.com'}/notifications" class="button">
                Ver en la App
            </a>
        </div>
        <div class="footer">
            <p>Has recibido este email porque tienes las notificaciones activadas.</p>
            <p>&copy; 2025 Walky. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    getNotificationType(title, content) {
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('paseo') || lowerTitle.includes('walk')) {
            if (lowerTitle.includes('pago') || lowerTitle.includes('payment')) return 'payment_confirmed';
            if (lowerTitle.includes('solicit') || lowerTitle.includes('nueva solicitud')) return 'walk_requested';
            if (lowerTitle.includes('acept') || lowerTitle.includes('confirm') || lowerTitle.includes('agend')) return 'walk_accepted';
            if (lowerTitle.includes('rechaz') || lowerTitle.includes('reject')) return 'walk_rejected';
            if (lowerTitle.includes('cancel')) return 'walk_cancelled';
            if (lowerTitle.includes('inici') || lowerTitle.includes('start')) return 'walk_started';
            if (lowerTitle.includes('complet') || lowerTitle.includes('finaliz')) return 'walk_completed';
        }
        
        if (lowerTitle.includes('solicitud') && lowerTitle.includes('paseador')) {
            return 'walker_registration';
        }
        
        if (lowerTitle.includes('mensaje') || lowerTitle.includes('chat')) return 'new_message';
        
        if (lowerTitle.includes('reseña') || lowerTitle.includes('review')) {
            if (lowerTitle.includes('actualiz') || lowerTitle.includes('edit')) return 'review_updated';
            return 'new_review';
        }
        
        if (lowerTitle.includes('ticket') || lowerTitle.includes('soporte')) return 'ticket_response';
        
        if (lowerTitle.includes('oferta') || lowerTitle.includes('banner')) return 'new_banner';
        
        if (lowerTitle.includes('suscripción') || lowerTitle.includes('plan')) {
            if (lowerTitle.includes('renov')) return 'subscription_renewed';
            return 'subscription_expiring';
        }
        
        return 'system_alert';
    }

    async sendNotificationEmail(notification, user) {
        try {
            const notifType = this.getNotificationType(notification.title, notification.content);
            const shouldSend = await this.shouldSendEmail(user.id, notifType);
            
            if (!shouldSend) {
                console.log(`⏭️ Skipping email for user ${user.id}: ${notifType} notifications disabled`);
                return { sent: false, reason: `User has ${notifType} notifications disabled` };
            }

            const mailOptions = {
                from: `"Walky" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: `🐾 ${notification.title}`,
                html: this.getEmailTemplate(notification, user)
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log(`✅ Email sent to ${user.email}: ${info.messageId}`);
            
            await db.query('UPDATE notifications SET email_sent = 1 WHERE id = ?', [notification.id]);

            await db.query(`
                INSERT INTO email_logs (notification_id, user_id, email_to, subject, event_type, status, sent_at) 
                VALUES (?, ?, ?, ?, ?, 'sent', NOW())
            `, [notification.id, user.id, user.email, notification.title, notifType]);

            return { sent: true, messageId: info.messageId };

        } catch (error) {
            console.error('❌ Error sending email:', error);
            
            try {
                await db.query(`
                    INSERT INTO email_logs (notification_id, user_id, email_to, subject, event_type, status, error_message) 
                    VALUES (?, ?, ?, ?, ?, 'failed', ?)
                `, [notification.id, user.id, user.email, notification.title, 'unknown', error.message]);
            } catch (logError) {
                console.error('Error logging email failure:', logError);
            }
            
            return { sent: false, error: error.message };
        }
    }

    async processEmailQueue() {
        try {
            const notifications = await db.query(`
                SELECT 
                    n.id, n.user_id, n.title, n.content,
                    nt.name as type, n.walker_name, n.created_at,
                    u.email, u.name as user_name
                FROM notifications n
                INNER JOIN users u ON n.user_id = u.id
                INNER JOIN notification_types nt ON n.type_id = nt.id
                WHERE n.email_sent = 0
                AND n.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
                AND u.email IS NOT NULL
                AND u.email != ''
                ORDER BY n.created_at ASC
                LIMIT 50
            `);

            console.log(`📧 Processing ${notifications.length} pending emails...`);

            let successCount = 0;
            let failCount = 0;
            let skippedCount = 0;

            for (const notif of notifications) {
                const user = { id: notif.user_id, email: notif.email, name: notif.user_name };
                const result = await this.sendNotificationEmail(notif, user);
                
                if (result.sent) {
                    successCount++;
                } else if (result.reason && result.reason.includes('disabled')) {
                    skippedCount++;
                    await db.query('UPDATE notifications SET email_sent = 1 WHERE id = ?', [notif.id]);
                } else {
                    failCount++;
                }

                await new Promise(resolve => setTimeout(resolve, 500));
            }

            console.log(`✅ Email queue processed: ${successCount} sent, ${skippedCount} skipped, ${failCount} failed`);
            
            return { processed: notifications.length, success: successCount, skipped: skippedCount, failed: failCount };

        } catch (error) {
            console.error('❌ Error processing email queue:', error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email, token, userName) {
        try {
            const mailOptions = {
                from: `"Walky" <${process.env.SMTP_USER}>`,
                to: email,
                subject: '🔐 Recuperación de Contraseña - Walky',
                html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .code-box { background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
        .message { font-size: 16px; line-height: 1.6; color: #333; margin-bottom: 20px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; font-size: 14px; color: #856404; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐾 Walky</h1>
        </div>
        <div class="content">
            <h2>Recuperación de Contraseña</h2>
            <div class="message">
                Hola ${userName || 'Usuario'},<br><br>
                Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código para continuar:
            </div>
            <div class="code-box">
                <div class="code">${token}</div>
            </div>
            <div class="warning">
                ⚠️ Este código expira en 10 minutos y solo puede ser usado una vez.
            </div>
            <div class="message">
                Si no solicitaste restablecer tu contraseña, ignora este correo. Tu cuenta permanecerá segura.
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2025 Walky. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            
            console.log(`✅ Password reset email sent to ${email}: ${info.messageId}`);
            
            return { sent: true, messageId: info.messageId };

        } catch (error) {
            console.error('❌ Error sending password reset email:', error);
            return { sent: false, error: error.message };
        }
    }
}

module.exports = new EmailService();