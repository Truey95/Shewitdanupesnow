import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePrintifyShops } from "@/hooks/use-printify";
import { useShopifyConnection } from "@/hooks/use-shopify";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ApiConfigInstructions } from "./ApiConfigInstructions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ConfigStatus {
  configured: boolean;
  hasApiKey: boolean;
  apiKeyLength: number;
  environmentVariables: string[];
  timestamp: string;
}

export function ApiConfigAlert() {
  const { error: printifyError, isLoading: printifyLoading } = usePrintifyShops();
  const { error: shopifyError, isLoading: shopifyLoading } = useShopifyConnection();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Configuration status check
  const { data: configStatus, isLoading: statusLoading } = useQuery<ConfigStatus>({
    queryKey: ['/api/printify/status'],
    retry: false,
    enabled: !!printifyError // Only check status if there's an error
  });

  // Configuration refresh mutation
  const refreshConfig = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/printify/refresh-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to refresh configuration');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Configuration Refreshed",
        description: data.message,
        variant: data.isConfigured ? "default" : "destructive"
      });
      // Refresh the Printify shops query
      queryClient.invalidateQueries({ queryKey: ['/api/printify/shops'] });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Don't show anything while loading or if there's no error
  if ((printifyLoading && shopifyLoading) || (!printifyError && !shopifyError)) {
    return null;
  }
  
  // Check if we're in a deployment environment
  const isProbablyDeployed = window.location.hostname !== 'localhost';
  
  return (
    <Alert variant={printifyError && shopifyError ? "destructive" : "warning"} className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {isProbablyDeployed ? "⚠️ Deployment API Configuration Required" : "API Configuration Issue"}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        {isProbablyDeployed && printifyError && (
          <p className="font-medium text-red-600">
            This appears to be a deployed environment, but the Printify API key is not configured. 
            Your visitors cannot see your product catalog without proper API configuration.
          </p>
        )}
        
        {printifyError && (
          <p>
            <strong>Printify API:</strong> Not properly configured. Products cannot be displayed.
            {isProbablyDeployed 
              ? " You must add the PRINTIFY_API_KEY to your deployment environment variables." 
              : " Please add your Printify API key in the environment variables."}
          </p>
        )}
        
        {shopifyError && !isProbablyDeployed && (
          <p>
            <strong>Shopify API:</strong> Not properly configured. Shopify products will not be available.
            Please check your Shopify API credentials in the environment variables.
          </p>
        )}
        
        {/* Configuration Status and Diagnostics */}
        {printifyError && configStatus && typeof configStatus === 'object' && 'configured' in configStatus && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium mb-2">Configuration Status:</h4>
            <div className="text-xs space-y-1 text-gray-600">
              <p>• API Key Configured: {configStatus.configured ? '✅ Yes' : '❌ No'}</p>
              <p>• Environment Variable: {configStatus.hasApiKey ? '✅ Set' : '❌ Missing'}</p>
              <p>• Key Length: {configStatus.apiKeyLength} characters</p>
              <p>• Last Checked: {new Date(configStatus.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <ApiConfigInstructions />
          
          {printifyError && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refreshConfig.mutate()}
              disabled={refreshConfig.isPending}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-3 h-3 ${refreshConfig.isPending ? 'animate-spin' : ''}`} />
              {refreshConfig.isPending ? 'Refreshing...' : 'Refresh Config'}
            </Button>
          )}
          
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Go to Admin
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  );
}