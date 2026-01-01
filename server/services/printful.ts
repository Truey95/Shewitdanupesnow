import type { PrintfulProduct, PrintfulVariant } from './types.js';

export class PrintfulService {
  private apiKey: string | null;
  private baseUrl = 'https://api.printful.com';
  public isConfigured: boolean;

  constructor() {
    this.apiKey = process.env.PRINTFUL_API_KEY || null;
    this.isConfigured = !!this.apiKey;

    if (!this.isConfigured) {
      console.warn('PRINTFUL_API_KEY environment variable is not set. Printful service will not be available.');
    }
  }

  private checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('Printful service is not properly configured. PRINTFUL_API_KEY is missing.');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making Printful API request:', {
      url,
      method: options.method || 'GET',
      endpoint
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Invalid JSON response from Printful API');
      }

      if (!response.ok) {
        console.error('Printful API error:', {
          status: response.status,
          statusText: response.statusText,
          endpoint,
          error: responseData,
          headers: Object.fromEntries(response.headers),
          requestUrl: url,
          responseBody: responseText
        });
        throw new Error(`Printful API error: ${responseData.error?.message || response.statusText}`);
      }

      console.log('Printful API response:', {
        endpoint,
        status: response.status,
        resultCount: Array.isArray(responseData.result) ? responseData.result.length : 'single item',
        dataPreview: JSON.stringify(responseData).substring(0, 200) + '...'
      });

      return responseData;
    } catch (error) {
      console.error('Printful API request failed:', {
        endpoint,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : 'Unknown error'
      });
      throw error;
    }
  }

  async checkConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Cannot check Printful connection: API key is missing');
      return false;
    }

    try {
      console.log('Testing Printful API connection...');
      const response = await this.request('/v2/stores');
      console.log('Store connection test successful:', response);
      return true;
    } catch (error) {
      console.error('Failed to connect to Printful API:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : 'Unknown error'
      });
      return false;
    }
  }

  async getProducts(): Promise<PrintfulProduct[]> {
    this.checkConfiguration();

    try {
      console.log('Fetching products from Printful...');
      const response = await this.request('/v2/sync/products');

      if (!response.result || !Array.isArray(response.result)) {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format from Printful API');
      }

      console.log('Retrieved products:', {
        count: response.result.length,
        products: response.result.map((p: PrintfulProduct) => ({
          id: p.id,
          name: p.name,
          variantCount: p.variants?.length
        }))
      });

      return response.result;
    } catch (error) {
      console.error('Error fetching Printful products:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : 'Unknown error'
      });
      throw error;
    }
  }

  async getProduct(productId: number): Promise<PrintfulProduct> {
    this.checkConfiguration();
    const response = await this.request(`/v2/sync/products/${productId}`);
    return response.result;
  }

  async syncProduct(productId: number): Promise<void> {
    this.checkConfiguration();
    await this.request(`/v2/sync/products/${productId}/sync`, {
      method: 'POST',
    });
  }
}

export const printfulService = new PrintfulService();