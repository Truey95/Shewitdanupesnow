import express from 'express';
import { orderHandlers } from '../services/orderService.js';

const router = express.Router();

// Local order management routes
router.post('/', orderHandlers.createOrder);
router.post('/:orderId/process-payment', orderHandlers.processPayment);
router.get('/:orderId/status', orderHandlers.getOrderStatus);
router.get('/', orderHandlers.getAllOrders);
router.post('/calculate-shipping/:shopId', orderHandlers.calculateShipping);
router.post('/:productId/sync-price', orderHandlers.syncProductPrice);

export default router;