import express from 'express';
import { printifyHandlers } from '../services/printify.js';
import { orderHandlers } from '../services/orderService.js';

const router = express.Router();

// Simple connection test route (No external deps)
router.get('/test', (_req, res) => {
    res.json({
        ok: true,
        message: "Printify router is working",
        timestamp: new Date().toISOString(),
        env: {
            hasKey: !!process.env.PRINTIFY_API_KEY,
            nodeVersion: process.version
        }
    });
});

// Configuration status and refresh routes
router.get('/status', printifyHandlers.getConfigurationStatus);
router.post('/refresh-config', printifyHandlers.refreshConfiguration);

// Product management routes
router.get('/shops', printifyHandlers.getShops);
router.get('/shops/:shopId/products', printifyHandlers.getProducts);
router.get('/shops/:shopId/products/:productId', printifyHandlers.getProduct);
router.post('/shops/:shopId/products', printifyHandlers.createProduct);
router.put('/shops/:shopId/products/:productId', printifyHandlers.updateProduct);
router.post('/shops/:shopId/products/:productId/publish', printifyHandlers.publishProduct);
router.post('/shops/:shopId/products/:productId/halt-publishing', printifyHandlers.haltPublishing);
router.post('/shops/:shopId/products/:productId/reset-publishing', printifyHandlers.resetPublishingStatus);
router.get('/shops/:shopId/products/:productId/publishing-status', printifyHandlers.getPublishingStatus);
router.post('/shops/:shopId/products/:productId/unpublish', printifyHandlers.unpublishProduct);

// Price sync routes
router.post('/shops/:shopId/products/:productId/sync-price', printifyHandlers.syncProductPrice);
router.post('/products/:productId/sync-price', orderHandlers.syncProductPrice);

// Order management routes
router.post('/shops/:shopId/orders', printifyHandlers.createOrder);
router.get('/shops/:shopId/orders', printifyHandlers.getOrders);
router.get('/shops/:shopId/orders/:orderId', printifyHandlers.getOrder);
router.post('/shops/:shopId/orders/:orderId/submit', printifyHandlers.submitOrderForProduction);
router.post('/shops/:shopId/calculate-shipping', printifyHandlers.calculateShipping);

// Local order management (moved to /api/orders router)

export default router;
