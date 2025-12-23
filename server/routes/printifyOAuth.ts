import { Router } from 'express';
import { oauthHandlers, webhookHandlers } from '../services/printifyOAuth';

const router = Router();

// OAuth routes
router.get('/oauth/status', oauthHandlers.getOAuthStatus);
router.post('/oauth/authorize', oauthHandlers.authorize);
router.post('/oauth/callback', oauthHandlers.callback);
router.post('/oauth/refresh', oauthHandlers.refreshToken);

// Webhook routes
router.post('/webhook', webhookHandlers.handleWebhook);
router.get('/webhook/config', webhookHandlers.getWebhookConfig);

export default router;