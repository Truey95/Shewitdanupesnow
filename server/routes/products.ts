import express from 'express';
import { db } from '../../db/index.js';
import { products } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { modalService } from '../services/modal.js';
import { daytonaService } from '../services/daytona.js';

const router = express.Router();

// Get all products
router.get('/', async (_req, res) => {
  try {
    const allProducts = await db.query.products.findMany({
      with: {
        sizes: true
      }
    });
    res.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, parseInt(req.params.id)),
      with: {
        sizes: true
      }
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// Comprehensive product update (title, description, price, category)
router.put('/:productId/update', async (req, res) => {
  try {
    const { productId } = req.params;
    const { title, description, price, category, shopId, printifyProductId, variants } = req.body;

    // DEBUGGING: Log incoming request details
    console.log('[ProductUpdate] Incoming request to backend:', {
      productId,
      title,
      price,
      category,
      shopId,
      printifyProductId,
      variantCount: variants?.length || 0
    });

    // Ensure we always send a response to prevent stuck loading states
    let updateResults = {
      titleUpdate: false,
      priceUpdate: false,
      databaseUpdate: false
    };

    if (!shopId || !printifyProductId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'shopId and printifyProductId are required'
      });
    }

    // Import services
    const { printifyService } = await import('../services/printify.js');

    // Update product in Printify (title, description) - with guaranteed response
    if (title || description) {
      try {
        console.log('[ProductUpdate] Sending product update request to Printify API...');
        const printifyUpdateResult = await printifyService.updateProduct(shopId, printifyProductId, {
          title,
          description
        });
        console.log('[ProductUpdate] Printify product update successful:', printifyUpdateResult ? 'SUCCESS' : 'NO_RESULT');
        updateResults.titleUpdate = true;
      } catch (error) {
        console.error('[ProductUpdate] Printify product update failed:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
        // Continue with other operations but log the failure
        updateResults.titleUpdate = false;
      }
    }

    // Update price in Printify if provided - with guaranteed response
    if (price && !isNaN(parseFloat(price))) {
      try {
        console.log('[ProductUpdate] Sending price sync request to Printify API for price:', parseFloat(price));
        const priceUpdateResult = await printifyService.syncProductPrice(shopId, printifyProductId, parseFloat(price));
        console.log('[ProductUpdate] Printify price sync successful:', priceUpdateResult ? 'SUCCESS' : 'NO_RESULT');
        updateResults.priceUpdate = true;
      } catch (error) {
        console.error('[ProductUpdate] Price sync failed:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined
        });
        // Continue with other operations but log the failure
        updateResults.priceUpdate = false;
      }
    }

    // Update local database
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.printifyProductId, printifyProductId)
    });

    if (existingProduct) {
      await db.update(products)
        .set({
          name: title || existingProduct.name,
          description: description || existingProduct.description,
          price: price ? parseFloat(price).toFixed(2) : existingProduct.price,
          category: category || existingProduct.category,
          printifyShopId: shopId,
          printifySyncedAt: new Date(),
          printifySyncStatus: 'synced'
        })
        .where(eq(products.id, existingProduct.id));
    } else {
      await db.insert(products).values({
        name: title || `Product ${printifyProductId}`,
        description: description || 'Synced from Printify',
        price: price ? parseFloat(price).toFixed(2) : '0.00',
        category: category || 'swdnn',
        printifyProductId,
        printifyShopId: shopId,
        imageUrl: '',
        printifySyncedAt: new Date(),
        printifySyncStatus: 'synced'
      });
    }

    // DEBUGGING: Log successful response before sending (ALWAYS send response)
    console.log('[ProductUpdate] Sending response to frontend:', updateResults);

    // Always send a success response to prevent stuck loading states
    // Even if some operations failed, we want the frontend to stop loading
    updateResults.databaseUpdate = true;

    res.json({
      success: true,
      message: 'Product update completed',
      updatedAt: new Date().toISOString(),
      results: updateResults,
      warnings: !updateResults.priceUpdate && price ? ['Price update failed - check Printify API logs'] : []
    });

  } catch (error) {
    // DEBUGGING: Enhanced error logging
    console.error('[ProductUpdate] Product update failed with error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      productId: req.params.productId
    });

    res.status(500).json({
      error: 'Failed to update product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update product category
router.put('/:productId/category', async (req, res) => {
  try {
    const { productId } = req.params;
    const { category, printifyProductId, shopId, name, description, price } = req.body;

    console.log('Updating product category:', { productId, category, printifyProductId, shopId });

    if (!category || !shopId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'category and shopId are required'
      });
    }

    // Prepare product data for external services
    const productData = {
      productId: printifyProductId || productId,
      name: name || `Product ${printifyProductId || productId}`,
      description: description || 'Synced from Printify',
      price: price || '0.00',
      category,
      shopId
    };

    // Process with Modal if configured
    if (modalService.isServiceConfigured()) {
      try {
        console.log('Processing product with Modal service...');
        await modalService.processProductData(productData);
        console.log('Modal processing completed successfully');
      } catch (modalError) {
        console.warn('Modal processing failed, continuing with save:', modalError);
      }
    }

    // Sync with Daytona if configured
    if (daytonaService.isServiceConfigured()) {
      try {
        console.log('Syncing product with Daytona service...');
        await daytonaService.syncProductData(productData);
        console.log('Daytona sync completed successfully');
      } catch (daytonaError) {
        console.warn('Daytona sync failed, continuing with save:', daytonaError);
      }
    }

    // Update or create product in local database
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.printifyProductId, printifyProductId || productId)
    });

    if (existingProduct) {
      // Update existing product with all fields
      await db.update(products)
        .set({
          name: name || existingProduct.name,
          description: description || existingProduct.description,
          price: price || existingProduct.price,
          category,
          printifyShopId: shopId,
          printifySyncedAt: new Date(),
          printifySyncStatus: 'synced'
        })
        .where(eq(products.id, existingProduct.id));
    } else {
      // Create new product record with proper defaults
      await db.insert(products).values({
        name: name || `Product ${printifyProductId || productId}`,
        description: description || 'Synced from Printify',
        price: price || '0.00',
        imageUrl: '',
        category,
        printifyProductId: printifyProductId || productId,
        printifyShopId: shopId,
        printifySyncedAt: new Date(),
        printifySyncStatus: 'synced'
      });
    }

    res.json({
      success: true,
      message: 'Product category updated successfully',
      category,
      productId: printifyProductId || productId,
      modalProcessed: modalService.isServiceConfigured(),
      daytonaSynced: daytonaService.isServiceConfigured()
    });

  } catch (error) {
    console.error('Failed to update product category:', error);
    res.status(500).json({
      error: 'Failed to update product category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const categoryProducts = await db.query.products.findMany({
      where: eq(products.category, category),
      orderBy: (products, { desc }: any) => [desc(products.createdAt)]
    });

    res.json({
      success: true,
      data: categoryProducts,
      category,
      count: categoryProducts.length
    });

  } catch (error) {
    console.error('Failed to get products by category:', error);
    res.status(500).json({
      error: 'Failed to get products by category',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Sync product from Printify
router.post('/:productId/sync', async (req, res) => {
  try {
    const { productId } = req.params;
    const { printifyData, shopId } = req.body;

    const existingProduct = await db.query.products.findFirst({
      where: eq(products.printifyProductId, productId)
    });

    if (existingProduct) {
      // Update existing product with Printify data
      await db.update(products)
        .set({
          name: printifyData.title || existingProduct.name,
          description: printifyData.description || existingProduct.description,
          printifyData: printifyData,
          printifySyncedAt: new Date(),
          printifySyncStatus: 'synced',
          printifyShopId: shopId
        })
        .where(eq(products.id, existingProduct.id));
    } else {
      // Create new product from Printify data
      await db.insert(products).values({
        name: printifyData.title || `Product ${productId}`,
        description: printifyData.description || '',
        price: printifyData.variants?.[0]?.price ? (printifyData.variants[0].price / 100).toString() : '0.00',
        imageUrl: printifyData.images?.[0]?.src || '',
        category: 'swdnn', // Default category
        printifyProductId: productId,
        printifyShopId: shopId,
        printifyData: printifyData,
        printifySyncedAt: new Date(),
        printifySyncStatus: 'synced'
      });
    }

    res.json({
      success: true,
      message: 'Product synced successfully',
      productId
    });

  } catch (error) {
    console.error('Failed to sync product:', error);
    res.status(500).json({
      error: 'Failed to sync product',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Price sync endpoint for admin dashboard
router.post('/:productId/sync-price', async (req, res) => {
  try {
    const { productId } = req.params;
    const { price, shopId, printifyProductId, variants } = req.body;

    if (!price || !shopId || !printifyProductId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'price, shopId, and printifyProductId are required'
      });
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        error: 'Invalid price',
        details: 'Price must be a valid positive number'
      });
    }

    // Import printifyService
    const { printifyService } = await import('../services/printify');

    console.log(`Syncing price for product ${printifyProductId}: $${numericPrice}`);
    console.log(`Variants available: ${variants?.length || 0}`);

    // Sync price to Printify
    await printifyService.syncProductPrice(shopId, printifyProductId, numericPrice);

    // Update local database
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.printifyProductId, printifyProductId)
    });

    if (existingProduct) {
      await db.update(products)
        .set({
          price: numericPrice.toFixed(2),
          printifySyncedAt: new Date(),
          printifySyncStatus: 'synced'
        })
        .where(eq(products.id, existingProduct.id));

      console.log(`Updated product ${existingProduct.id} in database with price $${numericPrice}`);
    } else {
      console.log(`Product ${printifyProductId} not found in local database, price synced to Printify only`);
    }

    res.json({
      success: true,
      message: 'Price synced successfully',
      price: numericPrice,
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to sync price:', error);
    res.status(500).json({
      error: 'Failed to sync price',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint for direct Printify price updates (per troubleshooting guide)
router.post('/test-price-update', async (req, res) => {
  try {
    const { productId, variantId, price, shopId } = req.body;

    console.log('[TestPriceUpdate] Direct Printify API test:', {
      productId,
      variantId,
      price,
      shopId
    });

    if (!productId || !variantId || !price || !shopId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, variantId, price, shopId'
      });
    }

    // Import printifyService
    const { printifyService } = await import('../services/printify');

    // Test direct API call to Printify with minimal payload
    const result = await printifyService.syncProductPrice(shopId, productId, parseFloat(price));

    console.log('[TestPriceUpdate] Printify API test result:', result ? 'SUCCESS' : 'NO_RESULT');

    res.json({
      success: true,
      message: 'Direct Printify API test completed',
      result: result || 'No result returned',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TestPriceUpdate] Direct API test failed:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    });

    // Always return a response to prevent stuck loading
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Direct API test failed',
      details: 'Check backend logs for full error details'
    });
  }
});

// Sync all product prices from Printify to local database
router.post('/sync-prices', async (req, res) => {
  try {
    console.log('[PriceSync] Starting bulk price synchronization from Printify');

    // Import printifyService
    const { printifyService } = await import('../services/printify');

    // Get all products from database that have Printify IDs
    const localProducts = await db.query.products.findMany({
      where: (products, { isNotNull }: any) => isNotNull(products.printifyProductId)
    });

    console.log(`[PriceSync] Found ${localProducts.length} products with Printify IDs`);

    const updateResults = [];

    for (const localProduct of localProducts) {
      if (!localProduct.printifyProductId || !localProduct.printifyShopId) {
        console.log(`[PriceSync] Skipping product ${localProduct.id} - missing Printify data`);
        continue;
      }

      try {
        // Get current product data from Printify
        const printifyProduct = await printifyService.getProduct(localProduct.printifyShopId, localProduct.printifyProductId);

        if (printifyProduct?.variants) {
          // Find enabled variant or fallback to first variant
          const enabledVariant = printifyProduct.variants.find((v: any) => v.is_enabled);
          const variantToUse = enabledVariant || printifyProduct.variants[0];

          if (variantToUse?.price) {
            const currentPrice = variantToUse.price / 100; // Convert cents to dollars

            // Update local database
            await db.update(products)
              .set({
                price: currentPrice.toFixed(2),
                printifySyncedAt: new Date(),
                printifySyncStatus: 'synced'
              })
              .where(eq(products.id, localProduct.id));

            updateResults.push({
              productId: localProduct.id,
              name: localProduct.name,
              oldPrice: localProduct.price,
              newPrice: currentPrice.toFixed(2),
              status: 'updated'
            });

            console.log(`[PriceSync] Updated ${localProduct.name}: $${localProduct.price} → $${currentPrice.toFixed(2)}`);
          }
        }
      } catch (error) {
        console.error(`[PriceSync] Failed to sync product ${localProduct.id}:`, error);
        updateResults.push({
          productId: localProduct.id,
          name: localProduct.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`[PriceSync] Completed: ${updateResults.filter(r => r.status === 'updated').length} updated, ${updateResults.filter(r => r.status === 'error').length} errors`);

    res.json({
      success: true,
      message: 'Price synchronization completed',
      results: updateResults,
      total: localProducts.length,
      updated: updateResults.filter(r => r.status === 'updated').length,
      errors: updateResults.filter(r => r.status === 'error').length
    });

  } catch (error) {
    console.error('[PriceSync] Bulk price sync failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync prices',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Sync ALL products from Printify to local database (New Endpoint)
router.post('/sync-all', async (req, res) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: shopId'
      });
    }

    console.log(`[ProductSync] Starting full sync for shop ${shopId}`);

    // Import printifyService
    const { printifyService } = await import('../services/printify.js');

    // Fetch all products from Printify
    const response = await printifyService.getProducts(shopId);

    // Handle response data safely
    const printifyProducts = response.data || (Array.isArray(response) ? response : []);

    console.log(`[ProductSync] Found ${printifyProducts.length} products in Printify`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const pProduct of printifyProducts) {
      try {
        // Prepare DB payload
        const price = pProduct.variants?.[0]?.price
          ? (pProduct.variants[0].price / 100).toFixed(2)
          : '0.00';

        const imageUrl = pProduct.images?.[0]?.src || '';

        // Strict keyword-based categorization
        const titleUpper = pProduct.title.toUpperCase();
        let category = 'swdnn'; // default fallback

        if (titleUpper.includes('SWDNN')) {
          category = 'swdnn';
        } else if (titleUpper.includes('HWDKN')) {
          category = 'hwdkn';
        } else if (titleUpper.includes('HWDZN')) {
          category = 'hwdzn';
        } else if (titleUpper.includes('HWDRN')) {
          category = 'hwdrn';
        } else if (titleUpper.includes('HWDPN') || titleUpper.includes('HWTPN')) {
          category = 'hwdpn';
        } else {
          // General type-based categorization for non-special items
          if (pProduct.tags && Array.isArray(pProduct.tags)) {
            if (pProduct.tags.some((t: string) => t.toLowerCase() === 'hoodie') || titleUpper.includes('HOODIE')) category = 'hoodies';
            else if (pProduct.tags.some((t: string) => t.toLowerCase().includes('shirt')) || titleUpper.includes('SHIRT') || titleUpper.includes('TEE')) category = 't-shirts';
            else if (pProduct.tags.some((t: string) => t.toLowerCase() === 'hat') || titleUpper.includes('HAT') || titleUpper.includes('CAP')) category = 'hats';
            else category = 'general';
          } else {
            category = 'general';
          }
        }

        const existingProduct = await db.query.products.findFirst({
          where: eq(products.printifyProductId, pProduct.id)
        });

        if (existingProduct) {
          await db.update(products).set({
            name: pProduct.title,
            description: pProduct.description,
            price: price,
            imageUrl: imageUrl || existingProduct.imageUrl,
            printifyShopId: shopId,
            printifyData: pProduct,
            printifySyncedAt: new Date(),
            printifySyncStatus: 'synced',
            category: existingProduct.category === 'swdnn' ? category : existingProduct.category
          }).where(eq(products.id, existingProduct.id));
        } else {
          await db.insert(products).values({
            name: pProduct.title,
            description: pProduct.description,
            price: price,
            imageUrl: imageUrl,
            category: category,
            printifyProductId: pProduct.id,
            printifyShopId: shopId,
            printifyData: pProduct,
            printifySyncedAt: new Date(),
            printifySyncStatus: 'synced'
          });
        }
        syncedCount++;
      } catch (err) {
        console.error(`[ProductSync] Failed to sync product ${pProduct.id}:`, err);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: 'Full product sync completed',
      stats: {
        total: printifyProducts.length,
        synced: syncedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('[ProductSync] Sync failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;