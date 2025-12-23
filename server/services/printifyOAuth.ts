import { Request, Response } from 'express';

export class PrintifyOAuthService {
  private appId: string | null;
  private clientSecret: string | null;
  private webhookUrl: string;
  public isOAuthConfigured: boolean;

  constructor() {
    this.appId = process.env.PRINTIFY_APP_ID || null;
    this.clientSecret = process.env.PRINTIFY_CLIENT_SECRET || null;
    this.webhookUrl = process.env.PRINTIFY_WEBHOOK_URL || 'https://shewitdanupesnow.com';
    this.isOAuthConfigured = !!(this.appId && this.clientSecret);

    console.log('[PrintifyOAuth] Configuration Status:');
    console.log(`[PrintifyOAuth] App ID exists: ${!!this.appId}`);
    console.log(`[PrintifyOAuth] Client Secret exists: ${!!this.clientSecret}`);
    console.log(`[PrintifyOAuth] Webhook URL: ${this.webhookUrl}`);
    console.log(`[PrintifyOAuth] OAuth Configured: ${this.isOAuthConfigured}`);
  }

  // Generate authorization URL for OAuth flow
  generateAuthUrl(acceptUrl: string, declineUrl: string, state?: string): string {
    if (!this.appId) {
      throw new Error('PRINTIFY_APP_ID is required for OAuth flow');
    }

    const params = new URLSearchParams({
      app_id: this.appId,
      accept_url: acceptUrl,
      decline_url: declineUrl,
    });

    if (state) {
      params.append('state', state);
    }

    return `https://printify.com/app/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForTokens(code: string): Promise<any> {
    if (!this.appId) {
      throw new Error('PRINTIFY_APP_ID is required');
    }

    const response = await fetch('https://api.printify.com/v1/app/oauth/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SheWitDaNupesNow-Ecommerce'
      },
      body: JSON.stringify({
        app_id: this.appId,
        code: code
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<any> {
    if (!this.appId) {
      throw new Error('PRINTIFY_APP_ID is required');
    }

    const response = await fetch('https://api.printify.com/v1/app/oauth/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SheWitDaNupesNow-Ecommerce'
      },
      body: JSON.stringify({
        app_id: this.appId,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // Webhook configuration
  getWebhookConfig() {
    return {
      url: this.webhookUrl,
      events: [
        'order:created',
        'order:updated', 
        'order:sent-to-production',
        'order:shipment:created',
        'order:shipment:delivered',
        'product:publish:started',
        'product:publish:succeeded',
        'product:publish:failed'
      ]
    };
  }

  // Process webhook payload
  async processWebhook(payload: any, signature?: string): Promise<any> {
    console.log('[PrintifyOAuth] Processing webhook:', {
      event: payload.type,
      orderId: payload.resource?.id,
      timestamp: new Date().toISOString()
    });

    // Webhook processing logic based on event type
    switch (payload.type) {
      case 'order:created':
        return this.handleOrderCreated(payload.resource);
      case 'order:updated':
        return this.handleOrderUpdated(payload.resource);
      case 'order:sent-to-production':
        return this.handleOrderSentToProduction(payload.resource);
      case 'order:shipment:created':
        return this.handleShipmentCreated(payload.resource);
      case 'order:shipment:delivered':
        return this.handleShipmentDelivered(payload.resource);
      case 'product:publish:started':
        return this.handleProductPublishStarted(payload.resource);
      case 'product:publish:succeeded':
        return this.handleProductPublishSucceeded(payload.resource);
      case 'product:publish:failed':
        return this.handleProductPublishFailed(payload.resource);
      default:
        console.log(`[PrintifyOAuth] Unhandled webhook event: ${payload.type}`);
        return { status: 'ignored', event: payload.type };
    }
  }

  private async handleOrderCreated(order: any) {
    console.log('[PrintifyOAuth] Order created:', order.id);
    // Add your order created logic here
    return { status: 'processed', action: 'order_created' };
  }

  private async handleOrderUpdated(order: any) {
    console.log('[PrintifyOAuth] Order updated:', order.id);
    // Add your order updated logic here
    return { status: 'processed', action: 'order_updated' };
  }

  private async handleOrderSentToProduction(order: any) {
    console.log('[PrintifyOAuth] Order sent to production:', order.id);
    // Add your production logic here
    return { status: 'processed', action: 'order_sent_to_production' };
  }

  private async handleShipmentCreated(shipment: any) {
    console.log('[PrintifyOAuth] Shipment created:', shipment.id);
    // Add your shipment tracking logic here
    return { status: 'processed', action: 'shipment_created' };
  }

  private async handleShipmentDelivered(shipment: any) {
    console.log('[PrintifyOAuth] Shipment delivered:', shipment.id);
    // Add your delivery confirmation logic here
    return { status: 'processed', action: 'shipment_delivered' };
  }

  private async handleProductPublishStarted(product: any) {
    console.log('[PrintifyOAuth] Product publish started:', product.id);
    return { status: 'processed', action: 'product_publish_started' };
  }

  private async handleProductPublishSucceeded(product: any) {
    console.log('[PrintifyOAuth] Product publish succeeded:', product.id);
    return { status: 'processed', action: 'product_publish_succeeded' };
  }

  private async handleProductPublishFailed(product: any) {
    console.log('[PrintifyOAuth] Product publish failed:', product.id);
    return { status: 'processed', action: 'product_publish_failed' };
  }
}

export const printifyOAuthService = new PrintifyOAuthService();

// OAuth handlers
export const oauthHandlers = {
  // Get OAuth configuration status
  getOAuthStatus: async (_req: Request, res: Response) => {
    res.json({
      isConfigured: printifyOAuthService.isOAuthConfigured,
      webhookUrl: printifyOAuthService.getWebhookConfig().url,
      hasAppId: !!process.env.PRINTIFY_APP_ID,
      hasClientSecret: !!process.env.PRINTIFY_CLIENT_SECRET
    });
  },

  // Start OAuth authorization flow
  authorize: async (req: Request, res: Response) => {
    try {
      const { acceptUrl, declineUrl, state } = req.body;
      
      if (!acceptUrl || !declineUrl) {
        return res.status(400).json({
          error: 'acceptUrl and declineUrl are required'
        });
      }

      const authUrl = printifyOAuthService.generateAuthUrl(acceptUrl, declineUrl, state);
      
      res.json({
        authUrl,
        message: 'Redirect user to this URL to authorize the application'
      });
    } catch (error) {
      console.error('[PrintifyOAuth] Authorization error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate authorization URL'
      });
    }
  },

  // Handle OAuth callback
  callback: async (req: Request, res: Response) => {
    try {
      const { code, state, error, error_description } = req.query;

      if (error) {
        return res.status(400).json({
          error: error,
          error_description: error_description,
          message: 'Authorization was denied or failed'
        });
      }

      if (!code) {
        return res.status(400).json({
          error: 'missing_code',
          message: 'Authorization code is required'
        });
      }

      const tokens = await printifyOAuthService.exchangeCodeForTokens(code as string);
      
      res.json({
        ...tokens,
        state,
        message: 'Successfully obtained access tokens'
      });
    } catch (error) {
      console.error('[PrintifyOAuth] Callback error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to process OAuth callback'
      });
    }
  },

  // Refresh access token
  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          error: 'refresh_token is required'
        });
      }

      const tokens = await printifyOAuthService.refreshAccessToken(refresh_token);
      
      res.json(tokens);
    } catch (error) {
      console.error('[PrintifyOAuth] Token refresh error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to refresh token'
      });
    }
  }
};

// Webhook handlers
export const webhookHandlers = {
  // Handle incoming webhooks from Printify
  handleWebhook: async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-printify-signature'] as string;
      const payload = req.body;

      console.log('[PrintifyOAuth] Received webhook:', {
        type: payload.type,
        resourceId: payload.resource?.id,
        timestamp: new Date().toISOString()
      });

      const result = await printifyOAuthService.processWebhook(payload, signature);
      
      res.json({
        received: true,
        processed: true,
        result
      });
    } catch (error) {
      console.error('[PrintifyOAuth] Webhook processing error:', error);
      res.status(500).json({
        received: true,
        processed: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook'
      });
    }
  },

  // Get webhook configuration
  getWebhookConfig: async (_req: Request, res: Response) => {
    res.json(printifyOAuthService.getWebhookConfig());
  }
};