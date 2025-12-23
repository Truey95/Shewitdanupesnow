import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useShopifyConnection } from "@/hooks/use-shopify";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ApiConfigInstructions } from "./ApiConfigInstructions";

export function ShopifyConfigAlert() {
  const { data, error, isLoading } = useShopifyConnection();
  
  // Don't show anything while loading
  if (isLoading) {
    return null;
  }
  
  // Show different alerts based on status
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Shopify API Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>
            There was an error connecting to the Shopify API. Shopify products may not display correctly.
          </p>
          
          <div className="flex gap-3 mt-2">
            <ApiConfigInstructions />
            
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
  
  if (data && data.status === 'demo') {
    return (
      <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertTitle>Shopify Demo Mode</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>
            Running with demo Shopify products. For production use, add your Shopify API credentials.
          </p>
          
          <div className="flex gap-3 mt-2">
            <ApiConfigInstructions />
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  if (data && data.status !== 'connected') {
    return (
      <Alert variant="warning" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Shopify API Configuration Required</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>
            The Shopify API is not properly configured. Shopify products will not be available.
            Please add your Shopify API credentials in the environment variables to connect to your store.
          </p>
          
          <div className="flex gap-3 mt-2">
            <ApiConfigInstructions />
            
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
  
  // API is configured correctly, don't show anything
  return null;
}