import { Request, Response } from 'express';
import fetch from 'node-fetch';
import type { RequestInit } from 'node-fetch';

// Implement rate limiting to adhere to Shopify's API limits
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minDelay: number;
  private bucketSize: number;
  private tokens: number;
  private lastRefillTime: number;
  private tokenRefillRate: number;

  constructor(requestsPerSecond: number, bucketSize: number = 40) {
    this.minDelay = 1000 / requestsPerSecond;
    this.bucketSize = bucketSize;
    this.tokens = bucketSize;
    this.lastRefillTime = Date.now();
    // Tokens per millisecond
    this.tokenRefillRate = requestsPerSecond / 1000;
  }

  private refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefillTime;
    const newTokens = timePassed * this.tokenRefillRate;
    
    this.tokens = Math.min(this.bucketSize, this.tokens + newTokens);
    this.lastRefillTime = now;
  }

  private consumeToken(): boolean {
    this.refillTokens();
    if (this.tokens < 1) {
      return false;
    }
    
    this.tokens -= 1;
    return true;
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
    
    // Check if we can consume a token
    if (!this.consumeToken()) {
      // Wait for token replenishment
      const waitTime = (1 - this.tokens) / this.tokenRefillRate;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
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

class ShopifyService {
  private apiKey: string | null;
  private password: string | null;
  private shopName: string | null;
  private apiVersion: string;
  private storefrontAccessToken: string | null;
  private rateLimiter: RateLimiter;
  public isConfigured: boolean;

  constructor() {
    // For development/demo purposes, providing default values
    this.apiKey = process.env.SHOPIFY_API_KEY || 'demo_api_key';
    this.password = process.env.SHOPIFY_API_PASSWORD || 'demo_password';
    this.shopName = process.env.SHOPIFY_SHOP_NAME || 'demo-store';
    this.apiVersion = process.env.SHOPIFY_API_VERSION || '2023-07';
    this.storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'demo_token';
    
    // Create rate limiter for Shopify REST API (2 requests per second is a safe default)
    this.rateLimiter = new RateLimiter(2);
    
    // Check if actual credentials are provided
    const hasRealCredentials = !!process.env.SHOPIFY_API_KEY && 
                              !!process.env.SHOPIFY_API_PASSWORD && 
                              !!process.env.SHOPIFY_SHOP_NAME;
    
    // For actual API requests, we need real credentials
    this.isConfigured = hasRealCredentials;
    
    if (!hasRealCredentials) {
      console.warn('Shopify API credentials are not set. Shopify service will not be available.');
      if (!process.env.SHOPIFY_API_KEY) console.warn('  - Missing SHOPIFY_API_KEY');
      if (!process.env.SHOPIFY_API_PASSWORD) console.warn('  - Missing SHOPIFY_API_PASSWORD');
      if (!process.env.SHOPIFY_SHOP_NAME) console.warn('  - Missing SHOPIFY_SHOP_NAME');
    } else {
      console.log('Shopify API credentials found. Shopify service is available.');
    }
  }

  private checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('Shopify service is not properly configured. Check SHOPIFY_API_KEY, SHOPIFY_API_PASSWORD, and SHOPIFY_SHOP_NAME environment variables.');
    }
  }

  // Get the admin API URL based on current configuration
  private get adminApiUrl(): string {
    return `https://${this.shopName}.myshopify.com/admin/api/${this.apiVersion}`;
  }

  // Get the storefront API URL based on current configuration
  private get storefrontApiUrl(): string {
    return `https://${this.shopName}.myshopify.com/api/${this.apiVersion}/graphql.json`;
  }

  private async adminRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    this.checkConfiguration();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.password!,
      ...(options.headers as Record<string, string> || {})
    };

    console.log(`Making Shopify Admin API request to: ${endpoint}`);

    return this.rateLimiter.enqueue<T>(async (): Promise<T> => {
      try {
        // Create a new options object without the body
        const { body, ...restOptions } = options;
        
        // Create properly typed request options for node-fetch
        const requestOptions: RequestInit = {
          ...restOptions,
          headers
        };
        
        // Only add body if it's defined and not null
        if (body !== undefined && body !== null) {
          requestOptions.body = body;
        }
        
        const response = await fetch(`${this.adminApiUrl}${endpoint}`, requestOptions);

        // Handle rate limiting - check headers for API rate limit info
        const rateLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit');
        if (rateLimitHeader) {
          console.log(`Shopify API rate limit status: ${rateLimitHeader}`);
          
          // Example header: "39/40" (current/limit)
          const [current, limit] = rateLimitHeader.split('/').map(Number);
          if (current && limit && current >= limit * 0.9) {
            console.warn(`Approaching Shopify API rate limit: ${current}/${limit}`);
          }
        }

        // Handle 429 Too Many Requests
        if (response.status === 429) {
          console.warn('Shopify API rate limit exceeded. Applying exponential backoff...');
          const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.adminRequest(endpoint, options);
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Shopify API error (${response.status}):`, errorText);
          throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`Successful response from ${endpoint}:`, JSON.stringify(data).slice(0, 200) + '...');
        return data;
      } catch (error) {
        console.error(`Error in Shopify API request to ${endpoint}:`, error);
        throw error;
      }
    });
  }

  private async storefrontRequest<T = any>(query: string, variables = {}): Promise<T> {
    this.checkConfiguration();
    
    if (!this.storefrontAccessToken) {
      throw new Error('Storefront access token is not configured. Please set SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variable.');
    }

    return this.rateLimiter.enqueue<T>(async (): Promise<T> => {
      try {
        // Ensure storefront token is never null when used in headers
        if (!this.storefrontAccessToken) {
          throw new Error('Storefront access token is required');
        }

        const response = await fetch(this.storefrontApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': this.storefrontAccessToken
          },
          body: JSON.stringify({
            query,
            variables
          })
        });

        // Handle rate limiting
        if (response.status === 429) {
          console.warn('Shopify Storefront API rate limit exceeded. Retrying after delay...');
          const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.storefrontRequest(query, variables);
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Shopify Storefront API error (${response.status}):`, errorText);
          throw new Error(`Shopify Storefront API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error in Shopify Storefront API request:', error);
        throw error;
      }
    });
  }

  async checkConnection(): Promise<boolean> {
    try {
      this.checkConfiguration();
      const data = await this.adminRequest('/shop.json');
      return !!data.shop;
    } catch (error) {
      console.error('Shopify connection check failed:', error);
      return false;
    }
  }

  async getProducts() {
    try {
      const data = await this.adminRequest('/products.json');
      return data.products;
    } catch (error) {
      console.error('Failed to fetch Shopify products:', error);
      throw error;
    }
  }

  async getProduct(productId: string | number) {
    try {
      const data = await this.adminRequest(`/products/${productId}.json`);
      return data.product;
    } catch (error) {
      console.error(`Failed to fetch Shopify product ${productId}:`, error);
      throw error;
    }
  }

  async getCollections() {
    try {
      const data = await this.adminRequest('/custom_collections.json');
      return data.custom_collections;
    } catch (error) {
      console.error('Failed to fetch Shopify collections:', error);
      throw error;
    }
  }

  async getProductsInCollection(collectionId: string | number) {
    try {
      const data = await this.adminRequest(`/collections/${collectionId}/products.json`);
      return data.products;
    } catch (error) {
      console.error(`Failed to fetch products in collection ${collectionId}:`, error);
      throw error;
    }
  }
}

export const shopifyService = new ShopifyService();

// Express route handlers
// Sample data for development when Shopify API is not configured
const mockShopifyProducts = [
  {
    id: 1001,
    title: "Premium Cotton T-Shirt",
    body_html: "High-quality cotton t-shirt with custom design. Comfortable fit and durable material.",
    vendor: "Fashion Apparel",
    product_type: "T-Shirt",
    created_at: "2023-10-15T10:00:00Z",
    handle: "premium-cotton-t-shirt",
    variants: [
      {
        id: 10011,
        product_id: 1001,
        title: "Small / Black",
        price: "29.99",
        sku: "TS-BLK-S",
        option1: "Small",
        option2: "Black",
        inventory_quantity: 25
      },
      {
        id: 10012,
        product_id: 1001,
        title: "Medium / Black",
        price: "29.99",
        sku: "TS-BLK-M",
        option1: "Medium",
        option2: "Black",
        inventory_quantity: 30
      }
    ],
    images: [
      {
        id: 9001,
        product_id: 1001,
        position: 1,
        src: "https://via.placeholder.com/600x800?text=T-Shirt+Black",
        variant_ids: [10011, 10012]
      }
    ]
  },
  {
    id: 1002,
    title: "Designer Hoodie",
    body_html: "Warm and stylish hoodie with premium quality fabric and custom embroidery.",
    vendor: "Urban Streetwear",
    product_type: "Hoodie",
    created_at: "2023-10-16T14:30:00Z",
    handle: "designer-hoodie",
    variants: [
      {
        id: 10021,
        product_id: 1002,
        title: "Large / Navy",
        price: "59.99",
        sku: "HD-NVY-L",
        option1: "Large",
        option2: "Navy",
        inventory_quantity: 15
      }
    ],
    images: [
      {
        id: 9002,
        product_id: 1002,
        position: 1,
        src: "https://via.placeholder.com/600x800?text=Hoodie+Navy",
        variant_ids: [10021]
      }
    ]
  },
  {
    id: 1003,
    title: "Slim Fit Jeans",
    body_html: "Modern slim fit jeans with stretch denim for maximum comfort.",
    vendor: "Denim Co.",
    product_type: "Jeans",
    created_at: "2023-10-17T09:15:00Z",
    handle: "slim-fit-jeans",
    variants: [
      {
        id: 10031,
        product_id: 1003,
        title: "32 / Blue",
        price: "49.99",
        sku: "JN-BLU-32",
        option1: "32",
        option2: "Blue",
        inventory_quantity: 20
      }
    ],
    images: [
      {
        id: 9003,
        product_id: 1003,
        position: 1,
        src: "https://via.placeholder.com/600x800?text=Jeans+Blue",
        variant_ids: [10031]
      }
    ]
  }
];

export const shopifyHandlers = {
  checkConnection: async (_req: Request, res: Response) => {
    if (!shopifyService.isConfigured) {
      return res.json({
        status: "demo",
        message: "Running in demo mode. Connect Shopify API for production use."
      });
    }
    
    try {
      const isConnected = await shopifyService.checkConnection();
      if (isConnected) {
        res.json({ status: "connected", message: "Successfully connected to Shopify API" });
      } else {
        res.status(500).json({ status: "error", message: "Failed to connect to Shopify API" });
      }
    } catch (error) {
      console.error('Shopify connection test error:', error);
      res.status(500).json({ 
        status: "error", 
        message: "Failed to test Shopify connection",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getProducts: async (_req: Request, res: Response) => {
    if (!shopifyService.isConfigured) {
      console.log('Shopify API is not configured. Returning demo products list.');
      return res.json({ products: mockShopifyProducts });
    }
    
    try {
      console.log('Fetching Shopify products...');
      const products = await shopifyService.getProducts();
      console.log(`Successfully fetched ${products.length} products from Shopify`);
      res.json({ products });
    } catch (error) {
      console.error('Failed to fetch Shopify products:', error);
      res.status(500).json({ 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getProduct: async (req: Request, res: Response) => {
    if (!shopifyService.isConfigured) {
      console.log('Shopify API is not configured. Returning demo product details.');
      const { productId } = req.params;
      // Find the mock product by ID
      const mockProduct = mockShopifyProducts.find(p => p.id.toString() === productId);
      
      if (mockProduct) {
        return res.json({ product: mockProduct });
      } else {
        return res.status(404).json({ 
          error: 'Product not found',
          details: 'The requested product was not found in the demo data'
        });
      }
    }
    
    try {
      const { productId } = req.params;
      console.log(`Fetching Shopify product ${productId}...`);
      const product = await shopifyService.getProduct(productId);
      console.log(`Successfully fetched product ${productId}`);
      res.json({ product });
    } catch (error) {
      console.error(`Failed to fetch Shopify product:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch product',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getCollections: async (_req: Request, res: Response) => {
    if (!shopifyService.isConfigured) {
      console.log('Shopify API is not configured. Returning demo collections.');
      return res.json({ 
        collections: [
          {
            id: 101,
            handle: "summer-collection",
            title: "Summer Collection",
            updated_at: "2023-10-20T12:00:00Z",
            body_html: "Our latest summer styles for the season",
            published_at: "2023-10-20T12:00:00Z",
            sort_order: "manual",
            published_scope: "web"
          },
          {
            id: 102,
            handle: "new-arrivals",
            title: "New Arrivals",
            updated_at: "2023-10-21T12:00:00Z",
            body_html: "Check out our newest products",
            published_at: "2023-10-21T12:00:00Z",
            sort_order: "manual",
            published_scope: "web"
          }
        ] 
      });
    }
    
    try {
      console.log('Fetching Shopify collections...');
      const collections = await shopifyService.getCollections();
      console.log(`Successfully fetched ${collections.length} collections from Shopify`);
      res.json({ collections });
    } catch (error) {
      console.error('Failed to fetch Shopify collections:', error);
      res.status(500).json({ 
        error: 'Failed to fetch collections',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  getProductsInCollection: async (req: Request, res: Response) => {
    if (!shopifyService.isConfigured) {
      console.log('Shopify API is not configured. Returning demo collection products.');
      // Just return some of our mock products as if they belong to the collection
      return res.json({ 
        products: mockShopifyProducts.slice(0, 2) 
      });
    }
    
    try {
      const { collectionId } = req.params;
      console.log(`Fetching products in Shopify collection ${collectionId}...`);
      const products = await shopifyService.getProductsInCollection(collectionId);
      console.log(`Successfully fetched ${products.length} products from collection ${collectionId}`);
      res.json({ products });
    } catch (error) {
      console.error(`Failed to fetch products in collection:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch collection products',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};