import { Request, Response } from 'express';
import fetch from 'node-fetch';
import type { RequestInit } from 'node-fetch';

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

// Implement rate limiting to respect Printify's API limits
// 600 requests per minute (10 req/sec) globally
// 200 requests per 30 minutes (0.11 req/sec) for product publishing
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minDelay: number;

  constructor(requestsPerSecond: number) {
    this.minDelay = 1000 / requestsPerSecond;
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Ensure minimum delay between requests
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.minDelay - elapsed));
    }

    const task = this.queue.shift();
    if (task) {
      this.lastRequestTime = Date.now();
      await task();
    }

    // Process next item using setTimeout to avoid stack overflow
    setTimeout(() => this.processQueue(), 0);
  }
}

class PrintifyService {
  public get apiKey(): string | null {
    return process.env.PRINTIFY_API_KEY || null;
  }

  public get isConfigured(): boolean {
    return !!this.apiKey;
  }

  private generalRateLimiter: RateLimiter;
  private publishRateLimiter: RateLimiter;
  private appName: string;

  constructor() {
    // 10 requests per second for general API
    this.generalRateLimiter = new RateLimiter(10);

    // 0.11 requests per second for publishing (200 per 30 minutes)
    this.publishRateLimiter = new RateLimiter(0.11);

    // Application name for User-Agent
    this.appName = 'LuxuryApparel-Ecommerce';

    // Enhanced logging for deployment debugging - run immediately on instantiation
    this.logInitialization();
  }

  private logInitialization() {
    console.log('[PrintifyService] Initialization Status:');
    console.log(`[PrintifyService] API Key exists (runtime check): ${!!this.apiKey}`);
    if (this.apiKey) {
      console.log(`[PrintifyService] API Key length: ${this.apiKey.length}`);
      console.log(`[PrintifyService] API Key prefix: ${this.apiKey.substring(0, 5)}...`);
    }
    console.log(`[PrintifyService] Environment check: PRINTIFY_API_KEY is ${process.env.PRINTIFY_API_KEY ? 'set' : 'not set'}`);

    if (!this.isConfigured) {
      console.error('[PrintifyService] CRITICAL: PRINTIFY_API_KEY environment variable is not set. Service will not be available.');
      console.error('[PrintifyService] Available environment variables:', Object.keys(process.env).filter(key => key.includes('PRINTIFY')));
    } else {
      console.log('[PrintifyService] ✅ Successfully initialized with API key');
    }
  }

  private checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('Printify service is not properly configured. PRINTIFY_API_KEY is missing.');
    }
  }

  // Method to refresh configuration (logging only now, as we read env var usage directly)
  public refreshConfiguration() {
    console.log('[PrintifyService] Refreshing configuration check...');
    this.logInitialization();
    return this.isConfigured;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}, isPublishEndpoint = false): Promise<T> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': this.appName, // Required by Printify per documentation
      ...(options.headers as Record<string, string> || {})
    };



    // Use appropriate rate limiter based on endpoint
    const limiter = isPublishEndpoint ? this.publishRateLimiter : this.generalRateLimiter;

    return limiter.enqueue<T>(async (): Promise<T> => {
      try {
        // Create a new options object with typed headers and without the body
        const { body, ...restOptions } = options;

        // Prepare request options with properly typed body
        const requestOptions: {
          method?: string;
          headers: Record<string, string>;
          body?: BodyInit;
          [key: string]: any;
        } = {
          ...restOptions,
          headers
        };

        // Only add body if defined and not null
        if (body !== undefined && body !== null) {
          requestOptions.body = body as BodyInit;
        }

        const response = await fetch(`${PRINTIFY_API_URL}${endpoint}`, requestOptions as any);

        // Handle rate limiting response
        if (response.status === 429) {
          console.warn('Printify rate limit exceeded. Retrying after delay...');
          // Wait and retry after recommended delay (default 1 minute if header not provided)
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.request(endpoint, options, isPublishEndpoint);
        }

        if (!response.ok) {
          let errorMessage = `Request failed with status: ${response.status}`;
          try {
            const errorBody = await response.text();
            console.error(`Printify API Error (${response.status}): ${errorBody}`);
            errorMessage += ` - ${errorBody}`;
          } catch (e) {
            console.error(`Failed to read error body: ${e}`);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        throw error;
      }
    });
  }

  async getShops() {
    this.checkConfiguration();
    console.log("[PrintifyService] getShops called. DEBUGGING START");
    console.log("[PrintifyService] KEY EXISTS:", !!process.env.PRINTIFY_API_KEY);

    // Use direct fetch for debugging to strip away any class-level abstractions temporarily
    try {
      const url = `${PRINTIFY_API_URL}/shops.json`;
      console.log(`[PrintifyService] Fetching: ${url}`);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': this.appName
        }
      });

      console.log("[PrintifyService] STATUS:", res.status);
      const text = await res.text(); // Capture raw text first
      console.log("[PrintifyService] RAW RESPONSE:", text.substring(0, 500)); // Log first 500 chars

      if (!res.ok) {
        throw new Error(`Printify API Error (${res.status}): ${text}`);
      }

      return JSON.parse(text);
    } catch (err) {
      console.error("[PrintifyService] SERVER ERROR:", err);
      throw err;
    }
  }

  async getProducts(shopId: string) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/products.json`);
  }

  async getProduct(shopId: string, productId: string) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/products/${productId}.json`);
  }

  async createProduct(shopId: string, productData: any) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/products.json`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(shopId: string, productId: string, productData: any) {
    this.checkConfiguration();

    const rateLimiter = this.generalRateLimiter;

    return await rateLimiter.enqueue(async () => {
      // Get existing product first to preserve structure
      const existingProduct = await this.getProduct(shopId, productId);

      const updatePayload = {
        ...existingProduct,
        ...productData,
        // Ensure tags are properly formatted
        tags: productData.tags || existingProduct.tags || [],
        // Preserve variants if not updating them
        variants: productData.variants || existingProduct.variants
      };

      return await this.request(`/shops/${shopId}/products/${productId}.json`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });
    });
  }

  async publishProduct(shopId: string, productId: string, publishData?: any) {
    this.checkConfiguration();

    // Printify publish endpoint - for basic publishing, no body is needed
    const requestOptions: any = {
      method: 'POST'
    };

    // Only include body if publishData is provided and has meaningful content
    if (publishData && typeof publishData === 'object' && Object.keys(publishData).length > 0) {
      // Filter out empty strings and null values
      const cleanedData = Object.fromEntries(
        Object.entries(publishData).filter(([_, value]) =>
          value !== null && value !== undefined && value !== ''
        )
      );

      if (Object.keys(cleanedData).length > 0) {
        requestOptions.body = JSON.stringify(cleanedData);
      }
    }

    console.log(`Publishing product ${productId} in shop ${shopId} with options:`, requestOptions.body || 'no body');

    return this.request(`/shops/${shopId}/products/${productId}/publish.json`, requestOptions, true);
  }

  async haltPublishing(shopId: string, productId: string) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/products/${productId}/publishing_failed.json`, {
      method: 'POST'
    }, true); // Mark as a publish endpoint for special rate limiting
  }

  async resetPublishingStatus(shopId: string, productId: string) {
    this.checkConfiguration();
    // First halt any existing publishing process
    try {
      await this.haltPublishing(shopId, productId);
      console.log(`Reset publishing status for product ${productId}`);
    } catch (error) {
      console.log(`No active publishing to halt for product ${productId}`);
    }
    return { success: true, message: 'Publishing status reset' };
  }

  async getPublishingStatus(shopId: string, productId: string) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/products/${productId}/publishing_succeeded.json`);
  }

  async unpublishProduct(shopId: string, productId: string) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/products/${productId}/unpublish.json`, {
      method: 'POST'
    }, true); // Mark as a publish endpoint for special rate limiting
  }

  // Order management methods
  async createOrder(shopId: string, orderData: any) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/orders.json`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getOrder(shopId: string, orderId: string) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/orders/${orderId}.json`);
  }

  async getOrders(shopId: string) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/orders.json`);
  }

  async calculateShipping(shopId: string, orderData: any) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/orders/shipping.json`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async submitOrderForProduction(shopId: string, orderId: string) {
    this.checkConfiguration();
    return this.request(`/shops/${shopId}/orders/${orderId}/send_to_production.json`, {
      method: 'POST'
    });
  }

  // Product price sync methods
  async syncProductPrice(shopId: string, productId: string, newPrice: number) {
    this.checkConfiguration();

    console.log(`[PrintifyService] Starting price sync for product ${productId}`);
    console.log(`[PrintifyService] Request details: shopId=${shopId}, productId=${productId}, newPrice=$${newPrice}`);

    try {
      // First get the current product data - NOT using rate limiter to avoid deadlock
      console.log(`[PrintifyService] Fetching product data for ${productId}`);
      const productResponse = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/products/${productId}.json`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': this.appName
        }
      });

      if (!productResponse.ok) {
        throw new Error(`Failed to fetch product: ${productResponse.status}`);
      }

      const product = await productResponse.json();
      console.log(`[PrintifyService] Product response structure:`, JSON.stringify(Object.keys(product)));
      console.log(`[PrintifyService] Product fetched, ${product?.variants?.length || 0} variants found`);
      console.log(`[PrintifyService] Product locked status: ${product.is_locked}`);

      if (!product?.variants) {
        throw new Error('Product variants not found');
      }

      // Check if product is locked
      if (product.is_locked) {
        throw new Error('Product is locked for editing. Please unlock the product in Printify before updating prices.');
      }

      // Get the first variant ID for targeted price update (Printify best practice)
      const firstVariant = product.variants[0];
      if (!firstVariant || !firstVariant.id) {
        throw new Error('No valid variant found for price update');
      }

      console.log(`[PrintifyService] Using variant ID ${firstVariant.id} for price update`);

      // Update ONLY the specific variant with new price (Printify expects price in cents)
      // Using minimal payload as recommended in troubleshooting guide
      const targetVariant = {
        id: firstVariant.id,
        price: Math.round(newPrice * 100)
      };

      console.log(`[PrintifyService] Updating price to $${newPrice} (${Math.round(newPrice * 100)} cents)`);

      // Update the product with new pricing - use rate limiter for PUT request
      const result = await this.generalRateLimiter.enqueue(async () => {
        // Ensure print_areas maintains the required structure with images field
        const fixedPrintAreas = product.print_areas?.map((area: any) => ({
          ...area,
          placeholders: area.placeholders?.map((placeholder: any) => ({
            ...placeholder,
            images: placeholder.images || [] // Ensure images field exists even if empty
          }))
        }));

        // Create minimal update payload focusing ONLY on variants (per troubleshooting guide)
        // Avoid sending full product data which can cause silent failures
        const updatePayload = {
          variants: [targetVariant]  // Send only the specific variant being updated
        };

        console.log(`[PrintifyService] Sending minimal variant-only update:`, {
          variantId: targetVariant.id,
          priceInCents: targetVariant.price,
          priceInDollars: newPrice
        });

        console.log('[PrintifyService] Sending PUT request to Printify API...');
        console.log('[PrintifyService] Request URL:', `${PRINTIFY_API_URL}/shops/${shopId}/products/${productId}.json`);
        console.log('[PrintifyService] Request payload contains variants:', updatePayload.variants?.length || 0);

        const updateResponse = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/products/${productId}.json`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': this.appName
          },
          body: JSON.stringify(updatePayload)
        });

        console.log('[PrintifyService] Printify API response status:', updateResponse.status);
        console.log('[PrintifyService] Printify API response headers:', Object.fromEntries(updateResponse.headers.entries()));

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text().catch(() => 'Unable to read error response');
          console.error('[PrintifyService] Printify API error response:', errorText);
          throw new Error(`Failed to update product price: ${updateResponse.status} - ${errorText}`);
        }

        const responseData = await updateResponse.json();
        console.log('[PrintifyService] Printify API successful response received');
        return responseData;
      });

      console.log(`[PrintifyService] Successfully synced price for product ${productId}`);
      console.log(`[PrintifyService] Final result:`, result ? 'SUCCESS' : 'NO_RESULT');
      return result;

    } catch (error) {
      console.error(`[PrintifyService] Price sync failed for product ${productId}:`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async syncProductPriceWithVariants(shopId: string, productId: string, newPrice: number, variants?: any[]) {
    this.checkConfiguration();

    const rateLimiter = this.generalRateLimiter;

    return await rateLimiter.enqueue(async () => {
      try {
        // First get the current product data
        const product = await this.getProduct(shopId, productId);

        if (!product?.data?.variants) {
          throw new Error('Product variants not found');
        }

        // Update all variants with the new price (Printify expects price in cents)
        const priceInCents = Math.round(newPrice * 100);
        const updatedVariants = product.data.variants.map((variant: any) => ({
          ...variant,
          price: priceInCents,
          is_enabled: true
        }));

        console.log(`Syncing price for product ${productId}: $${newPrice} (${priceInCents} cents)`);
        console.log(`Updating ${updatedVariants.length} variants`);

        // Update the product with new pricing
        const result = await this.updateProduct(shopId, productId, {
          ...product.data,
          variants: updatedVariants
        });

        console.log(`Successfully synced price for product ${productId}`);
        return result;

      } catch (error) {
        console.error(`Price sync failed for product ${productId}:`, error);
        throw error;
      }
    });
  }
}

export const printifyService = new PrintifyService();

// Express route handlers
export const printifyHandlers = {
  getConfigurationStatus: async (_req: Request, res: Response) => {
    let isValid = false;
    let connectionError = null;

    // Only attempt real connection if key is present
    if (printifyService.isConfigured) {
      try {
        // Try to fetch shops (lightweight call) to verify key validity
        await printifyService.getShops();
        isValid = true;
      } catch (error) {
        console.error('[PrintifyService] Connection verification failed:', error);
        connectionError = error instanceof Error ? error.message : 'Unknown connection error';
        isValid = false;
      }
    }

    const status = {
      configured: printifyService.isConfigured && isValid, // Only report true if KEY IS VALID
      hasApiKey: !!process.env.PRINTIFY_API_KEY,
      isValid: isValid,
      connectionError: connectionError,
      apiKeyLength: process.env.PRINTIFY_API_KEY?.length || 0,
      environmentVariables: Object.keys(process.env).filter(key => key.includes('PRINTIFY')),
      timestamp: new Date().toISOString()
    };

    console.log('[PrintifyService] Configuration status requested:', status);
    res.json(status);
  },

  refreshConfiguration: async (_req: Request, res: Response) => {
    console.log('[PrintifyService] Configuration refresh requested');
    const wasConfigured = printifyService.isConfigured;
    const newStatus = printifyService.refreshConfiguration();

    const result = {
      success: true,
      wasConfigured,
      isConfigured: newStatus,
      message: newStatus
        ? (wasConfigured ? 'Configuration was already working' : 'Configuration restored successfully')
        : 'Configuration is still not available',
      timestamp: new Date().toISOString()
    };

    res.json(result);
  },

  getShops: async (_req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      console.warn('Printify API is not configured. Returning empty shops list.');
      return res.status(503).json({
        error: 'Configuration Error',
        message: 'Printify API is not configured. Please set the PRINTIFY_API_KEY environment variable.',
        configured: false
      });
    }

    try {
      console.log('Fetching Printify shops...');
      const shops = await printifyService.getShops();
      console.log('Successfully fetched shops:', shops);
      res.json(shops);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
      res.status(500).json({
        error: 'Failed to fetch shops',
        message: error instanceof Error ? error.message : 'Unknown error',
        configured: true
      });
    }
  },

  getProducts: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      return res.json({ data: [] });
    }

    try {
      const { shopId } = req.params;
      const products = await printifyService.getProducts(shopId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  },

  getProduct: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      return res.json({ data: null });
    }

    try {
      const { shopId, productId } = req.params;
      const product = await printifyService.getProduct(shopId, productId);
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  updateProduct: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      return res.status(503).json({ error: 'Service Unavailable' });
    }

    try {
      const { shopId, productId } = req.params;
      const updatedProduct = await printifyService.updateProduct(shopId, productId, req.body);
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  },

  createProduct: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      return res.status(503).json({ error: 'Service Unavailable' });
    }

    try {
      const { shopId } = req.params;
      const result = await printifyService.createProduct(shopId, req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create product' });
    }
  },

  publishProduct: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      console.warn('Printify API is not configured. Cannot publish product.');
      return res.status(503).json({
        error: 'Service Unavailable',
        details: 'Printify API is not configured. Please add PRINTIFY_API_KEY to the environment variables.'
      });
    }

    try {
      const { shopId, productId } = req.params;
      const publishData = req.body;

      console.log(`Publishing product ${productId} in shop ${shopId}...`);
      console.log(`Publish data:`, JSON.stringify(publishData, null, 2));

      const result = await printifyService.publishProduct(shopId, productId, publishData);

      console.log(`Successfully published product ${productId}`);
      res.json(result);
    } catch (error) {
      console.error('Failed to publish product:', error);
      res.status(500).json({
        error: 'Failed to publish product',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  haltPublishing: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      console.warn('Printify API is not configured. Cannot halt publishing.');
      return res.status(503).json({
        error: 'Service Unavailable',
        details: 'Printify API is not configured. Please add PRINTIFY_API_KEY to the environment variables.'
      });
    }

    try {
      const { shopId, productId } = req.params;

      console.log(`Halting publishing for product ${productId} in shop ${shopId}...`);

      const result = await printifyService.haltPublishing(shopId, productId);

      console.log(`Successfully halted publishing for product ${productId}`);
      res.json(result);
    } catch (error) {
      console.error('Failed to halt publishing:', error);
      res.status(500).json({
        error: 'Failed to halt publishing',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  resetPublishingStatus: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      console.warn('Printify API is not configured. Cannot reset publishing status.');
      return res.status(503).json({
        error: 'Service Unavailable',
        details: 'Printify API is not configured. Please add PRINTIFY_API_KEY to the environment variables.'
      });
    }

    try {
      const { shopId, productId } = req.params;

      console.log(`Resetting publishing status for product ${productId} in shop ${shopId}...`);

      const result = await printifyService.resetPublishingStatus(shopId, productId);

      console.log(`Successfully reset publishing status for product ${productId}`);
      res.json(result);
    } catch (error) {
      console.error('Failed to reset publishing status:', error);
      res.status(500).json({
        error: 'Failed to reset publishing status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getPublishingStatus: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      console.warn('Printify API is not configured. Cannot get publishing status.');
      return res.status(503).json({
        error: 'Service Unavailable',
        details: 'Printify API is not configured. Please add PRINTIFY_API_KEY to the environment variables.'
      });
    }

    try {
      const { shopId, productId } = req.params;

      console.log(`Getting publishing status for product ${productId} in shop ${shopId}...`);

      const result = await printifyService.getPublishingStatus(shopId, productId);

      console.log(`Successfully retrieved publishing status for product ${productId}`);
      res.json(result);
    } catch (error) {
      console.error('Failed to get publishing status:', error);
      res.status(500).json({
        error: 'Failed to get publishing status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  unpublishProduct: async (req: Request, res: Response) => {
    if (!printifyService.isConfigured) {
      console.warn('Printify API is not configured. Cannot unpublish product.');
      return res.status(503).json({
        error: 'Service Unavailable',
        details: 'Printify API is not configured. Please add PRINTIFY_API_KEY to the environment variables.'
      });
    }

    try {
      const { shopId, productId } = req.params;

      console.log(`Unpublishing product ${productId} in shop ${shopId}...`);

      const result = await printifyService.unpublishProduct(shopId, productId);

      console.log(`Successfully unpublished product ${productId}`);
      res.json(result);
    } catch (error) {
      console.error('Failed to unpublish product:', error);
      res.status(500).json({
        error: 'Failed to unpublish product',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Order management handlers
  createOrder: async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const orderData = req.body;

    if (!printifyService.isConfigured) {
      return res.status(503).json({
        error: 'Configuration Error',
        message: 'Printify API is not configured.',
        configured: false
      });
    }

    try {
      const result = await printifyService.createOrder(shopId, orderData);
      res.json(result);
    } catch (error) {
      console.error('Failed to create order:', error);
      res.status(500).json({
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getOrders: async (req: Request, res: Response) => {
    const { shopId } = req.params;

    if (!printifyService.isConfigured) {
      return res.status(503).json({
        error: 'Configuration Error',
        message: 'Printify API is not configured.',
        configured: false
      });
    }

    try {
      const result = await printifyService.getOrders(shopId);
      res.json(result);
    } catch (error) {
      console.error('Failed to get orders:', error);
      res.status(500).json({
        error: 'Failed to get orders',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getOrder: async (req: Request, res: Response) => {
    const { shopId, orderId } = req.params;

    if (!printifyService.isConfigured) {
      return res.status(503).json({
        error: 'Configuration Error',
        message: 'Printify API is not configured.',
        configured: false
      });
    }

    try {
      const result = await printifyService.getOrder(shopId, orderId);
      res.json(result);
    } catch (error) {
      console.error('Failed to get order:', error);
      res.status(500).json({
        error: 'Failed to get order',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  calculateShipping: async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const orderData = req.body;

    if (!printifyService.isConfigured) {
      return res.status(503).json({
        error: 'Configuration Error',
        message: 'Printify API is not configured.',
        configured: false
      });
    }

    try {
      const result = await printifyService.calculateShipping(shopId, orderData);
      res.json(result);
    } catch (error) {
      console.error('Failed to calculate shipping:', error);
      res.status(500).json({
        error: 'Failed to calculate shipping',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  syncProductPrice: async (req: Request, res: Response) => {
    const { shopId, productId } = req.params;
    const { price } = req.body;

    if (!printifyService.isConfigured) {
      return res.status(503).json({
        error: 'Configuration Error',
        message: 'Printify API is not configured.',
        configured: false
      });
    }

    try {
      const result = await printifyService.syncProductPrice(shopId, productId, price);
      res.json(result);
    } catch (error) {
      console.error('Failed to sync product price:', error);
      res.status(500).json({
        error: 'Failed to sync product price',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  submitOrderForProduction: async (req: Request, res: Response) => {
    const { shopId, orderId } = req.params;

    if (!printifyService.isConfigured) {
      return res.status(503).json({
        error: 'Configuration Error',
        message: 'Printify API is not configured.',
        configured: false
      });
    }

    try {
      const result = await printifyService.submitOrderForProduction(shopId, orderId);
      res.json(result);
    } catch (error) {
      console.error('Failed to submit order for production:', error);
      res.status(500).json({
        error: 'Failed to submit order for production',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};