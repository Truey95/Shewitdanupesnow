import express from 'express';
import { printifyService } from '../services/printify.js';
import { shopifyService } from '../services/shopify.js';

const router = express.Router();

// Comprehensive API status endpoint
router.get('/', async (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    apis: {
      printify: {
        configured: printifyService.isConfigured,
        status: 'unknown' as string,
        shops: null as any,
        error: null as string | null
      },
      shopify: {
        configured: shopifyService.isConfigured,
        status: 'unknown' as string,
        connection: false,
        error: null as string | null
      }
    }
  };

  // Test Printify API
  if (printifyService.isConfigured) {
    try {
      const shops = await printifyService.getShops();
      status.apis.printify.status = 'operational';
      status.apis.printify.shops = shops;
    } catch (error) {
      status.apis.printify.status = 'error';
      status.apis.printify.error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    status.apis.printify.status = 'not_configured';
    status.apis.printify.error = 'PRINTIFY_API_KEY not set';
  }

  // Test Shopify API
  if (shopifyService.isConfigured) {
    try {
      const connection = await shopifyService.checkConnection();
      status.apis.shopify.status = 'operational';
      status.apis.shopify.connection = connection;
    } catch (error) {
      status.apis.shopify.status = 'error';
      status.apis.shopify.error = error instanceof Error ? error.message : 'Unknown error';
    }
  } else {
    status.apis.shopify.status = 'not_configured';
    status.apis.shopify.error = 'Missing SHOPIFY_API_KEY, SHOPIFY_API_PASSWORD, or SHOPIFY_SHOP_NAME';
  }

  res.json(status);
});

// Force sync all products from Printify to database
router.post('/sync-all-products', async (req, res) => {
  if (!printifyService.isConfigured) {
    return res.status(503).json({
      error: 'Printify API not configured',
      message: 'Please set PRINTIFY_API_KEY environment variable'
    });
  }

  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({
        error: 'Missing shopId',
        message: 'Please provide a Printify shop ID'
      });
    }

    console.log(`Starting bulk sync for shop ${shopId}...`);

    // Get all products from Printify
    const products = await printifyService.getProducts(shopId);
    console.log(`Found ${products.data.length} products in Printify shop`);

    let syncedCount = 0;
    let errorCount = 0;

    // Sync each product to local database
    for (const product of products.data) {
      try {
        // Sync product to database
        const syncResponse = await fetch(`http://localhost:5001/api/products/${product.id}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            printifyData: product,
            shopId: shopId
          }),
        });

        if (syncResponse.ok) {
          syncedCount++;
          console.log(`Synced product ${product.id}: ${product.title}`);
        } else {
          errorCount++;
          console.error(`Failed to sync product ${product.id}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error syncing product ${product.id}:`, error);
      }
    }

    res.json({
      success: true,
      message: 'Bulk sync completed',
      stats: {
        total: products.data.length,
        synced: syncedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('Bulk sync error:', error);
    res.status(500).json({
      error: 'Bulk sync failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test live Printify connection
router.get('/test-printify', async (req, res) => {
  if (!printifyService.isConfigured) {
    return res.status(503).json({
      error: 'Printify API not configured',
      message: 'Please set PRINTIFY_API_KEY environment variable'
    });
  }

  try {
    const shops = await printifyService.getShops();

    if (shops.length > 0) {
      const shopId = shops[0].id;
      const products = await printifyService.getProducts(shopId.toString());

      res.json({
        success: true,
        message: 'Printify API is working in live mode',
        data: {
          shops: shops,
          sampleProducts: products.data.slice(0, 3) // Show first 3 products
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Printify API connected but no shops found',
        data: { shops: [] }
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Printify API test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;