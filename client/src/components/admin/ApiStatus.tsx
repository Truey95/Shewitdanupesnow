import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Loader2,
  Settings,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiStatus {
  timestamp: string;
  apis: {
    printify: {
      configured: boolean;
      status: string;
      shops: any[];
      error: string | null;
    };
    shopify: {
      configured: boolean;
      status: string;
      connection: boolean;
      error: string | null;
    };
  };
}

export default function ApiStatus() {
  const { toast } = useToast();
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkApiStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/status/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        throw new Error('Failed to fetch API status');
      }
    } catch (error) {
      toast({
        title: "Status Check Failed",
        description: "Unable to check API status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncAllProducts = async () => {
    if (!status?.apis.printify.shops?.[0]) {
      toast({
        title: "No Shop Available",
        description: "Please ensure Printify is configured and has shops",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/status/sync-all-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: status.apis.printify.shops[0].id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Sync Complete",
          description: `Synced ${data.stats.synced} of ${data.stats.total} products`,
        });
        checkApiStatus(); // Refresh status
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Unable to sync products from Printify",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  const getStatusBadge = (apiStatus: string, configured: boolean) => {
    if (!configured) {
      return <Badge variant="secondary">Not Configured</Badge>;
    }
    
    switch (apiStatus) {
      case 'operational':
        return <Badge className="bg-green-100 text-green-800">Live</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Checking API status...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Status</h2>
          <p className="text-gray-600">Monitor live API connections and sync data</p>
        </div>
        <Button 
          onClick={checkApiStatus}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Printify Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Printify API
                </CardTitle>
                {getStatusBadge(status.apis.printify.status, status.apis.printify.configured)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                {status.apis.printify.configured ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span>
                  {status.apis.printify.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              {status.apis.printify.error && (
                <Alert>
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>{status.apis.printify.error}</AlertDescription>
                </Alert>
              )}

              {status.apis.printify.shops && status.apis.printify.shops.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Connected Shops:</h4>
                  {status.apis.printify.shops.map((shop: any) => (
                    <div key={shop.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{shop.title}</div>
                        <div className="text-sm text-gray-500">ID: {shop.id}</div>
                      </div>
                      <Badge variant="outline">{shop.sales_channel}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {status.apis.printify.configured && (
                <Button 
                  onClick={syncAllProducts}
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync All Products
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Shopify Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Shopify API
                </CardTitle>
                {getStatusBadge(status.apis.shopify.status, status.apis.shopify.configured)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                {status.apis.shopify.configured ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span>
                  {status.apis.shopify.configured ? 'Configured' : 'Not Configured'}
                </span>
              </div>

              {status.apis.shopify.error && (
                <Alert>
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>{status.apis.shopify.error}</AlertDescription>
                </Alert>
              )}

              {!status.apis.shopify.configured && (
                <Alert>
                  <Settings className="w-4 h-4" />
                  <AlertDescription>
                    To enable Shopify integration, add your API credentials in the environment settings.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {status && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Last Updated:</strong><br />
                {new Date(status.timestamp).toLocaleString()}
              </div>
              <div>
                <strong>Environment:</strong><br />
                {status.apis.printify.configured || status.apis.shopify.configured ? 'Live' : 'Demo'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}