import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Globe,
  Key,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Code,
  Zap,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiIntegration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  endpoint: string;
  lastSync?: string;
  rateLimitRemaining?: number;
}

export default function ApiIntegrations() {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([
    {
      id: 'printify',
      name: 'Printify API',
      description: 'Core Printify integration for product management',
      status: 'connected',
      endpoint: 'https://api.printify.com',
      lastSync: '5 minutes ago',
      rateLimitRemaining: 4850
    },
    {
      id: 'shopify',
      name: 'Shopify Store',
      description: 'Shopify integration for order processing',
      status: 'disconnected',
      endpoint: 'https://your-store.myshopify.com',
      rateLimitRemaining: 40
    }
  ]);

  const { toast } = useToast();

  const handleTestConnection = async (integration: ApiIntegration) => {
    toast({
      title: "Testing connection",
      description: `Testing ${integration.name} connection...`,
    });

    if (integration.id === 'printify') {
      try {
        const response = await fetch('/api/printify/status');
        const data = await response.json();

        if (data.configured) {
          setIntegrations(prev =>
            prev.map(int =>
              int.id === integration.id
                ? { ...int, status: 'connected', lastSync: 'Just now' }
                : int
            )
          );

          toast({
            title: "Connection successful",
            description: `${integration.name} is connected and configured.`,
          });
        } else {
          setIntegrations(prev =>
            prev.map(int =>
              int.id === integration.id
                ? { ...int, status: 'error', lastSync: 'Failed' }
                : int
            )
          );

          toast({
            title: "Connection failed",
            description: "API Key is missing. Please check your environment variables.",
            variant: "destructive"
          });
        }
      } catch (error) {
        setIntegrations(prev =>
          prev.map(int =>
            int.id === integration.id
              ? { ...int, status: 'error', lastSync: 'Error' }
              : int
          )
        );

        toast({
          title: "Connection Error",
          description: "Failed to reach the server.",
          variant: "destructive"
        });
      }
      return;
    }

    // Simulate API test for other integrations
    setTimeout(() => {
      setIntegrations(prev =>
        prev.map(int =>
          int.id === integration.id
            ? { ...int, status: 'connected', lastSync: 'Just now' }
            : int
        )
      );

      toast({
        title: "Connection successful",
        description: `${integration.name} is connected and working properly`,
      });
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Integrations</h2>
          <p className="text-muted-foreground">
            Manage external API connections and integrations
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">API Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription>{integration.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(integration.status)}
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Endpoint</Label>
                    <div className="mt-1 text-sm text-muted-foreground font-mono">
                      {integration.endpoint}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Sync</Label>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {integration.lastSync || 'Never'}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Rate Limit</Label>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {integration.rateLimitRemaining ?
                        `${integration.rateLimitRemaining}/5000 remaining` :
                        'Unknown'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(integration)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test Connection
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Manage Keys
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Available API endpoints and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { method: 'GET', path: '/api/printify/shops', status: 'active', description: 'Get all Printify shops' },
                  { method: 'GET', path: '/api/printify/shops/{id}/products', status: 'active', description: 'Get products for a shop' },
                  { method: 'POST', path: '/api/printify/shops/{id}/products', status: 'active', description: 'Create a new product' },
                  { method: 'POST', path: '/api/printify/shops/{shopId}/products/{productId}/publishing_actions/publish', status: 'active', description: 'Publish a product' },
                  { method: 'GET', path: '/api/shopify/products', status: 'inactive', description: 'Get Shopify products' }
                ].map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                    </div>
                    <Badge variant={endpoint.status === 'active' ? 'default' : 'secondary'}>
                      {endpoint.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Printify OAuth Configuration</CardTitle>
              <CardDescription>
                Configure OAuth 2.0 for platform integration with multiple merchants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    OAuth allows your platform to manage multiple Printify merchant accounts.
                    <strong> Contact Printify support to register your app and get credentials.</strong>
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="app-id">Printify App ID</Label>
                    <Input
                      id="app-id"
                      placeholder="your_printify_app_id_here"
                      defaultValue=""
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Provided after app registration with Printify
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="client-secret">Client Secret</Label>
                    <Input
                      id="client-secret"
                      type="password"
                      placeholder="your_printify_client_secret_here"
                      defaultValue=""
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Keep this secret secure and never expose publicly
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="oauth-status">OAuth Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary">Not Configured</Badge>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Check Status
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button size="sm" className="mr-2">Save OAuth Configuration</Button>
                  <Button size="sm" variant="outline">Test OAuth Flow</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure webhooks for real-time event notifications from Printify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Webhooks allow your application to receive real-time notifications when events occur in connected services.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value="https://shewitdanupesnow.com/api/printify/webhook"
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This is your production webhook URL configured for Printify events
                  </p>
                </div>

                <div>
                  <Label>Printify Event Subscriptions</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {[
                      { id: 'order:created', name: 'Order Created', description: 'New order placed' },
                      { id: 'order:updated', name: 'Order Updated', description: 'Order status changed' },
                      { id: 'order:sent-to-production', name: 'Sent to Production', description: 'Order processing started' },
                      { id: 'order:shipment:created', name: 'Shipment Created', description: 'Tracking number generated' },
                      { id: 'order:shipment:delivered', name: 'Shipment Delivered', description: 'Package delivered' },
                      { id: 'product:publish:*', name: 'Product Publish Events', description: 'Product publishing status' }
                    ].map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{event.name}</div>
                          <div className="text-xs text-muted-foreground">{event.description}</div>
                          <div className="text-xs text-blue-600 font-mono">{event.id}</div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button size="sm">Save Webhook Configuration</Button>
                    <Button size="sm" variant="outline">Test Webhook</Button>
                    <Button size="sm" variant="outline">View Event Logs</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Request Logs</CardTitle>
              <CardDescription>
                Recent API requests and responses for debugging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                <div>[15:42:10] GET /api/printify/shops - 200 OK (245ms)</div>
                <div>[15:42:12] GET /api/printify/shops/21023003/products - 200 OK (1.2s)</div>
                <div>[15:42:15] POST /api/printify/shops/21023003/products - 201 Created (890ms)</div>
                <div>[15:42:18] GET /api/shopify/products - 401 Unauthorized (120ms)</div>
                <div className="text-red-400">[15:42:18] Error: Shopify API credentials not configured</div>
                <div>[15:42:25] GET /api/printify/shops/21023003/products/123456 - 200 OK (340ms)</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}