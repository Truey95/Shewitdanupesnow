import express from 'express';
import { getSupabase } from '../services/supabase.js';
import { modalService } from '../services/modal.js';
import { daytonaService } from '../services/daytona.js';

const router = express.Router();

// Get all products
router.get('/', async (_req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { data: allProducts, error } = await supabase
      .from('products')
      .select('*, sizes(*)');

    if (error) throw error;

    // Map to camelCase for frontend
    const mappedProducts = (allProducts || []).map(p => ({
      ...p,
      imageUrl: p.image_url,
      isActive: p.is_active,
      printifyProductId: p.printify_product_id,
      printifyShopId: p.printify_shop_id,
      printifyData: p.printify_data,
      printifySyncedAt: p.printify_synced_at,
      printifySyncStatus: p.printify_sync_status,
      createdAt: p.created_at
    }));

    res.json(mappedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*, sizes(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Map to camelCase
    const mappedProduct = {
      ...product,
      imageUrl: product.image_url,
      isActive: product.is_active,
      printifyProductId: product.printify_product_id,
      printifyShopId: product.printify_shop_id,
      printifyData: product.printify_data,
      printifySyncedAt: product.printify_synced_at,
      printifySyncStatus: product.printify_sync_status,
      createdAt: product.created_at
    };

    res.json(mappedProduct);
  } catch (error) {
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

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    // Update local database (Supabase)
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('printify_product_id', printifyProductId)
      .single();

    if (existingProduct) {
      await supabase
        .from('products')
        .update({
          name: title || existingProduct.name,
          description: description || existingProduct.description,
          price: price ? parseFloat(price).toFixed(2) : existingProduct.price,
          category: category || existingProduct.category,
          printify_shop_id: shopId,
          printify_synced_at: new Date().toISOString(),
          printify_sync_status: 'synced'
        })
        .eq('id', existingProduct.id);
    } else {
      await supabase
        .from('products')
        .insert({
          name: title || `Product ${printifyProductId}`,
          description: description || 'Synced from Printify',
          price: price ? parseFloat(price).toFixed(2) : '0.00',
          category: category || 'swdnn',
          printify_product_id: printifyProductId,
          printify_shop_id: shopId,
          image_url: '',
          printify_synced_at: new Date().toISOString(),
          printify_sync_status: 'synced'
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

    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('printify_product_id', printifyProductId || productId)
      .single();

    if (existingProduct) {
      await supabase
        .from('products')
        .update({
          name: name || existingProduct.name,
          description: description || existingProduct.description,
          price: price || existingProduct.price,
          category,
          printify_shop_id: shopId,
          printify_synced_at: new Date().toISOString(),
          printify_sync_status: 'synced'
        })
        .eq('id', existingProduct.id);
    } else {
      await supabase
        .from('products')
        .insert({
          name: name || `Product ${printifyProductId || productId}`,
          description: description || 'Synced from Printify',
          price: price || '0.00',
          image_url: '',
          category,
          printify_product_id: printifyProductId || productId,
          printify_shop_id: shopId,
          printify_synced_at: new Date().toISOString(),
          printify_sync_status: 'synced'
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
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: "Database not configured" });
    }

    const { data: categoryProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map to camelCase
    const mappedProducts = (categoryProducts || []).map(p => ({
      ...p,
      imageUrl: p.image_url,
      isActive: p.is_active,
      printifyProductId: p.printify_product_id,
      printifyShopId: p.printify_shop_id,
      printifyData: p.printify_data,
      printifySyncedAt: p.printify_synced_at,
      printifySyncStatus: p.printify_sync_status,
      createdAt: p.created_at
    }));

    res.json({
      success: true,
      data: mappedProducts,
      category,
      count: mappedProducts.length
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

    console.log(`[ProductSync] Starting full sync via Supabase Client for shop ${shopId}`);
    const { printifyService } = await import('../services/printify.js');
    const response = await printifyService.getProducts(shopId);
    const printifyProducts = response.data || (Array.isArray(response) ? response : []);

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

        const supabase = getSupabase();
        if (!supabase) {
          throw new Error("Database not configured");
        }

        const { data: existingProduct } = await supabase
          .from('products')
          .select('id, category, image_url, name, description')
          .eq('printify_product_id', pProduct.id)
          .single();

        if (existingProduct) {
          await supabase
            .from('products')
            .update({
              name: pProduct.title || 'Untitled Product',
              description: pProduct.description || '',
              price: price,
              image_url: imageUrl || existingProduct.image_url,
              printify_shop_id: shopId,
              printify_data: pProduct,
              printify_synced_at: new Date().toISOString(),
              printify_sync_status: 'synced',
              category: existingProduct.category === 'swdnn' ? category : existingProduct.category
            })
            .eq('id', existingProduct.id);
        } else {
          await supabase
            .from('products')
            .insert({
              name: pProduct.title || 'Untitled Product',
              description: pProduct.description || '',
              price: price,
              image_url: imageUrl,
              category: category,
              printify_product_id: pProduct.id,
              printify_shop_id: shopId,
              printify_data: pProduct,
              printify_synced_at: new Date().toISOString(),
              printify_sync_status: 'synced'
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