import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { products, productSizes, printfulSyncLogs } from "@db/schema";
import { eq } from "drizzle-orm";
import { printfulService } from "./services/printful";
import printifyRouter from "./routes/printify";
import printifyOAuthRouter from "./routes/printifyOAuth";
import shopifyRouter from "./routes/shopify";
import adminRouter from "./routes/admin";
import tryOnRouter from "./routes/try-on";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import debugRouter from "./routes/debug";
import apiStatusRouter from "./routes/api-status";
import modalRouter from "./routes/modal";
import daytonaRouter from "./routes/daytona";
import eventsRouter from "./routes/events";
import uploadRouter from "./routes/upload";

export function registerRoutes(app: Express): Server {
  // Add API Status routes
  app.use('/api/status', apiStatusRouter);
  
  // Add Printify routes
  app.use('/api/printify', printifyRouter);
  
  // Add Printify OAuth and Webhook routes
  app.use('/api/printify', printifyOAuthRouter);
  
  // Add Shopify routes
  app.use('/api/shopify', shopifyRouter);
  
  // Add Admin routes
  app.use('/api/admin', adminRouter);
  
  // Add Products routes
  app.use('/api/products', productsRouter);
  
  // Add Orders routes  
  app.use('/api/orders', ordersRouter);
  
  // Add Modal API routes
  app.use('/api/modal', modalRouter);
  
  // Add Daytona API routes
  app.use('/api/daytona', daytonaRouter);
  
  // Add Events routes
  app.use('/api/events', eventsRouter);
  
  // Add Upload routes
  app.use('/api/upload', uploadRouter);
  
  // Add Debug routes
  app.use('/api/debug', debugRouter);
  
  // Add Try-On route
  app.use(tryOnRouter);

  // Add a test endpoint to verify Printful connection
  app.get("/api/printful/test", async (_req, res) => {
    if (!printfulService.isConfigured) {
      console.warn('Printful API is not configured. Cannot test connection.');
      return res.status(503).json({ 
        status: "error", 
        message: "Printful API is not configured. Please add PRINTFUL_API_KEY to the environment variables."
      });
    }
    
    try {
      const isConnected = await printfulService.checkConnection();
      if (isConnected) {
        res.json({ status: "connected", message: "Successfully connected to Printful API" });
      } else {
        res.status(500).json({ status: "error", message: "Failed to connect to Printful API" });
      }
    } catch (error) {
      console.error('Printful connection test error:', error);
      res.status(500).json({ status: "error", message: "Failed to test Printful connection" });
    }
  });

  app.post("/api/printful/sync", async (_req, res) => {
    if (!printfulService.isConfigured) {
      console.warn('Printful API is not configured. Cannot sync products.');
      return res.status(503).json({ 
        status: "error", 
        message: "Printful API is not configured. Please add PRINTFUL_API_KEY to the environment variables."
      });
    }
    
    try {
      console.log('Starting Printful product sync...');
      const printfulProducts = await printfulService.getProducts();
      console.log(`Retrieved ${printfulProducts.length} products from Printful`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const printfulProduct of printfulProducts) {
        try {
          const existingProduct = await db.query.products.findFirst({
            where: eq(products.printfulProductId, printfulProduct.id)
          });

          if (existingProduct) {
            console.log(`Updating existing product: ${printfulProduct.name}`);
            await db.update(products).set({
              name: printfulProduct.name,
              printfulSyncedAt: new Date(),
              printfulSyncStatus: 'synced',
              printfulData: printfulProduct
            }).where(eq(products.id, existingProduct.id));
            syncedCount++;
          } else {
            console.log(`Creating new product: ${printfulProduct.name}`);
            const price = parseFloat(printfulProduct.variants[0]?.price || '0');
            if (isNaN(price)) {
              console.error(`Invalid price for product ${printfulProduct.name}`);
              continue;
            }

            const newProduct = await db.insert(products).values({
              name: printfulProduct.name,
              description: printfulProduct.name,
              price: price.toString(), 
              imageUrl: printfulProduct.thumbnail_url || 'placeholder',
              category: 'imported',
              printfulProductId: printfulProduct.id,
              printfulSyncedAt: new Date(),
              printfulSyncStatus: 'synced',
              printfulData: printfulProduct
            }).returning();

            if (newProduct[0]) {
              console.log(`Adding variants for product: ${printfulProduct.name}`);
              for (const variant of printfulProduct.variants) {
                await db.insert(productSizes).values({
                  productId: newProduct[0].id,
                  size: variant.size,
                  inStock: 1,
                  printfulVariantId: variant.id,
                  printfulSku: variant.sku
                });
              }
              syncedCount++;
            }
          }

          // Log successful sync
          await db.insert(printfulSyncLogs).values({
            productId: existingProduct?.id,
            status: 'success',
            message: `Successfully synced product: ${printfulProduct.name}`,
            syncData: printfulProduct
          });

        } catch (productError) {
          console.error(`Error syncing product ${printfulProduct.name}:`, productError);
          errorCount++;
          // Log sync error
          await db.insert(printfulSyncLogs).values({
            productId: null,
            status: 'error',
            message: `Failed to sync product: ${printfulProduct.name}`,
            syncData: { error: productError instanceof Error ? productError.message : 'Unknown error', product: printfulProduct }
          });
        }
      }

      res.json({ 
        message: "Products sync completed",
        stats: {
          total: printfulProducts.length,
          synced: syncedCount,
          errors: errorCount
        }
      });
    } catch (error) {
      console.error('Printful sync error:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : 'Unknown error'
      });
      res.status(500).json({ 
        message: "Failed to sync products",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}