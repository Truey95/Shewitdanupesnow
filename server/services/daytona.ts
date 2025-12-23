import fetch from 'node-fetch';

interface DaytonaConfig {
  apiKey: string;
  baseUrl: string;
}

class DaytonaService {
  private apiKey: string;
  private baseUrl: string;
  private isConfigured: boolean;

  constructor(config?: Partial<DaytonaConfig>) {
    this.apiKey = config?.apiKey || process.env.DAYTONA_API_KEY || '';
    this.baseUrl = config?.baseUrl || 'https://app.daytona.io/api';
    this.isConfigured = !!this.apiKey;
    
    if (!this.isConfigured) {
      console.warn('Daytona service not configured. Missing DAYTONA_API_KEY environment variable.');
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SWDNN-Ecommerce/1.0'
    };
  }

  async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Daytona service is not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`Daytona API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Daytona API call failed:', error);
      throw error;
    }
  }

  async syncProductData(productData: any): Promise<any> {
    // For product data sync, we'll use a workspace-based approach
    // since Daytona primarily manages development workspaces
    console.log('Daytona: Processing product data for workspace sync...');
    console.log('Product data:', JSON.stringify(productData, null, 2));
    
    // Return a simulated successful response for now
    // In production, this would create/update a workspace with the product data
    return {
      success: true,
      workspace: 'swdnn-products',
      syncedAt: new Date().toISOString(),
      productData
    };
  }

  async getWorkspaces(): Promise<any> {
    return this.makeRequest('/workspaces');
  }

  async createWorkspace(workspaceData: any): Promise<any> {
    return this.makeRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify(workspaceData)
    });
  }

  async deployProject(projectId: string, deploymentConfig: any): Promise<any> {
    return this.makeRequest(`/projects/${projectId}/deploy`, {
      method: 'POST',
      body: JSON.stringify(deploymentConfig)
    });
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const daytonaService = new DaytonaService();
export default DaytonaService;