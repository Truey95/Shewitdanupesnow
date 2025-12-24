import express from 'express';
import { printifyService } from '../services/printify.js';

const router = express.Router();

// Debug endpoint to test Printify connection
router.get('/printify/test', async (req, res) => {
  try {
    const shops = await printifyService.getShops();
    res.json({
      success: true,
      message: 'Printify connection working',
      shops: shops,
      isConfigured: printifyService.isConfigured
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isConfigured: printifyService.isConfigured
    });
  }
});

// Debug endpoint to check API endpoints
router.get('/endpoints', async (req, res) => {
  res.json({
    success: true,
    endpoints: {
      'GET /api/printify/shops': 'Get all shops',
      'GET /api/printify/shops/:shopId/products': 'Get products in shop',
      'PUT /api/printify/shops/:shopId/products/:productId': 'Update product',
      'PUT /api/products/:productId/category': 'Update product category',
      'POST /api/products/:productId/sync': 'Sync product with Printify'
    }
  });
});

export default router;