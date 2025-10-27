// utils/MessageDelivery.js
import jwt from 'jsonwebtoken';

export class MessageDelivery {
    static generateWebhookToken() {
        return jwt.sign(
            {
                iss: 'nextjs-admin',
                iat: Math.floor(Date.now() / 1000)
            },
            process.env.WEBHOOK_SECRET,
            { expiresIn: '5m' }
        );
    }

    static async deliverMessage(conversationId, savedMessage) {
        const token = this.generateWebhookToken();
        if(!token) {
            throw new Error('Token failed at Generation');
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_NODEJS_SERVER}/api/v1/webadmin/deliver-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId,
                    message: savedMessage
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Message delivered via HTTP webhook');
                return { ...result, method: 'http-webhook' };
            } else {
                const error = await response.json();
                throw new Error(error.error || 'HTTP delivery failed');
            }
        } catch (error) {
            console.log('❌ HTTP webhook delivery failed:', error.message);
            return {
                success: false,
                error: error.message,
                method: 'none'
            };
        }
    }
}