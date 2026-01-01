import express from 'express';
import { db } from "../../db/index.js";
import { products, productSizes } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
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
    let product;
    
    // Check if it's a numeric ID
    const isNumeric = /^\d+$/.test(req.params.id);

    if (isNumeric) {
      product = await db.query.products.findFirst({
        where: eq(products.id, parseInt(req.params.id)),
        with: {
            sizes: true
        }
      });
    } else {
      // If not strictly numeric, try looking up by printify_product_id (which might be stored as string in params but bigint/string in db?)
      // Since schema uses bigint for printfulProductId, but Printify IDs are usually strings in API.
      // Wait, the schema has: printifyProductId: text("printify_product_id"),
      // So string comparison is correct for printifyProductId.
      product = await db.query.products.findFirst({
        where: eq(products.printifyProductId, req.params.id),
        with: {
            sizes: true
        }
      });
    }

    if (!product) {
      console.log(`[ProductDetail] Product ${req.params.id} not found.`);
      return res.status(404).json({ message: "Product not found", requestedId: req.params.id });
    }

    res.json(product);
  } catch (error) {
    console.error(`[ProductDetail] Error fetching product ${req.params.id}:`, error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// Comprehensive product update (title, description, price, category)
router.put('/:productId/update', async (req, res) => {
  try {
    const { productId } = req.params;
    const { title, description, price, category, shopId, printifyProductId, variants } = req.body;

    console.log('[ProductUpdate] Incoming request to backend:', {
      productId,
      title,
      price,
      category,
      shopId,
      printifyProductId,
      variantCount: variants?.length || 0
    });

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

    const { printifyService } = await import('../services/printify.js');

    // Update product in Printify (title, description)
    if (title || description) {
      try {
        console.log('[ProductUpdate] Sending product update request to Printify API...');
        await printifyService.updateProduct(shopId, printifyProductId, {
          title,
          description
        });
        updateResults.titleUpdate = true;
      } catch (error) {
        console.error('[ProductUpdate] Printify product update failed:', error);
        updateResults.titleUpdate = false;
      }
    }

    // Update price in Printify
    if (price && !isNaN(parseFloat(price))) {
      try {
        console.log('[ProductUpdate] Sending price sync request to Printify API...');
        await printifyService.syncProductPrice(shopId, printifyProductId, parseFloat(price));
        updateResults.priceUpdate = true;
      } catch (error) {
        console.error('[ProductUpdate] Price sync failed:', error);
        updateResults.priceUpdate = false;
      }
    }

    // Update local database (Drizzle)
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.printifyProductId, printifyProductId)
    });

    if (existingProduct) {
      await db.update(products).set({
        name: title || existingProduct.name,
        description: description || existingProduct.description,
        price: price ? parseFloat(price).toFixed(2) : existingProduct.price,
        category: category || existingProduct.category,
        printifyShopId: shopId,
        printifySyncedAt: new Date(),
        printifySyncStatus: 'synced'
      }).where(eq(products.id, existingProduct.id));
    } else {
      await db.insert(products).values({
        name: title || `Product ${printifyProductId}`,
        description: description || 'Synced from Printify',
        price: price ? parseFloat(price).toFixed(2) : '0.00',
        category: category || 'swdnn',
        printifyProductId: printifyProductId,
        printifyShopId: shopId,
        imageUrl: '',
        printifySyncedAt: new Date(),
        printifySyncStatus: 'synced'
      });
    }

    updateResults.databaseUpdate = true;
    res.json({
      success: true,
      message: 'Product update completed',
      updatedAt: new Date().toISOString(),
      results: updateResults,
      warnings: !updateResults.priceUpdate && price ? ['Price update failed - check Printify API logs'] : []
    });

  } catch (error) {
    console.error('[ProductUpdate] Product update failed:', error);
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

    if (!category || !shopId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const targetId = printifyProductId || productId;

    const existingProduct = await db.query.products.findFirst({
        where: eq(products.printifyProductId, targetId)
    });

    if (existingProduct) {
      await db.update(products).set({
        name: name || existingProduct.name,
        description: description || existingProduct.description,
        price: price ? price : existingProduct.price, // ensure price is string/decimal
        category,
        printifyShopId: shopId,
        printifySyncedAt: new Date(),
        printifySyncStatus: 'synced'
      }).where(eq(products.id, existingProduct.id));
    } else {
      await db.insert(products).values({
        name: name || `Product ${targetId}`,
        description: description || 'Synced from Printify',
        price: price ? price : '0.00',
        imageUrl: '',
        category,
        printifyProductId: targetId,
        printifyShopId: shopId,
        printifySyncedAt: new Date(),
        printifySyncStatus: 'synced'
      });
    }

    res.json({ success: true, message: 'Product category updated successfully' });
  } catch (error) {
    console.error('Failed to update product category:', error);
    res.status(500).json({ error: 'Failed to update product category' });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Using simple query for category
    const categoryProducts = await db.query.products.findMany({
      where: eq(products.category, category),
      orderBy: [desc(products.createdAt)]
    });

    res.json({
      success: true,
      data: categoryProducts,
      category,
      count: categoryProducts.length
    });
  } catch (error) {
    console.error('Failed to get products by category:', error);
    res.status(500).json({ error: 'Failed to get products by category' });
  }
});

// Sync ALL products from Printify to local database
router.post('/sync-all', async (req, res) => {
  try {
    const { shopId } = req.body;
    if (!shopId) return res.status(400).json({ success: false, error: 'Missing shopId' });

    console.log(`[ProductSync] Starting full sync via Drizzle for shop ${shopId}`);
    const { printifyService } = await import('../services/printify.js');

    let allCollectedProducts: any[] = [];
    let currentPage = 1;
    let lastPage = 1;

    do {
      console.log(`[ProductSync] Fetching page ${currentPage}...`);
      const response: any = await printifyService.getProducts(shopId, currentPage); // Ensure getProducts accepts page

      const pageProducts = response.data || (Array.isArray(response) ? response : []);
      allCollectedProducts = [...allCollectedProducts, ...pageProducts];

      if (response.last_page) {
        lastPage = response.last_page;
      } else {
        // If no pagination info, assume single page and stop
        lastPage = currentPage;
      }

      currentPage++;
    } while (currentPage <= lastPage);

    const printifyProducts = allCollectedProducts;

    console.log(`[ProductSync] Found ${printifyProducts.length} products in Printify`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const pProduct of printifyProducts) {
      try {
        const price = pProduct.variants?.[0]?.price
          ? (pProduct.variants[0].price / 100).toFixed(2)
          : '0.00';
        const imageUrl = pProduct.images?.[0]?.src || '';
        const titleUpper = pProduct.title.toUpperCase();
        let category = 'swdnn'; // default

        // Categorization logic
        if (titleUpper.includes('SWDNN')) category = 'swdnn';
        else if (titleUpper.includes('HWDKN')) category = 'hwdkn';
        else if (titleUpper.includes('HWDZN')) category = 'hwdzn';
        else if (titleUpper.includes('HWDRN')) category = 'hwdrn';
        else if (titleUpper.includes('HWDPN') || titleUpper.includes('HWTPN')) category = 'hwdpn';
        else {
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
            columns: {
                id: true,
                category: true,
                imageUrl: true,
                name: true,
                description: true,
                price: true // Keep existing price if we don't want to overwrite it blindly? Or adhere to logic below.
            },
            where: eq(products.printifyProductId, pProduct.id)
        });

        if (existingProduct) {
          await db.update(products).set({
              name: pProduct.title || 'Untitled Product',
              description: pProduct.description || '',
              // price: price, // logic in original was updating price.
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
            name: pProduct.title || 'Untitled Product',
            description: pProduct.description || '',
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
        errors.push({ productId: pProduct.id, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    res.json({
      success: true,
      message: 'Full product sync completed',
      stats: { total: printifyProducts.length, synced: syncedCount, errors: errorCount, errorDetails: errors.slice(0, 5) }
    });
  } catch (error) {
    console.error('[ProductSync] Sync failed:', error);
    res.status(500).json({ success: false, error: 'Failed to sync products', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;