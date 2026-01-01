import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

export function ApiConfigInstructions() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <InfoIcon className="h-4 w-4" />
          API Setup Instructions
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>API Configuration Instructions</AlertDialogTitle>
          <AlertDialogDescription>
            Follow these steps to configure the API integrations for this application.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 overflow-y-auto max-h-[60vh] p-3">
          <div className="border p-4 rounded-md bg-yellow-50">
            <h3 className="text-lg font-semibold mb-2">⚠️ Important for Deployment</h3>
            <p className="text-sm mb-2">
              <strong>When deploying your application, you must set the API keys in the deployment environment!</strong>
            </p>
            <ol className="list-decimal ml-5 space-y-1 text-sm">
              <li>Set environment variables through your hosting platform’s configuration panel or Vercel's dashboard</li>
              <li>Without properly set environment variables in the deployed environment, your catalog will not be visible to visitors</li>
            </ol>
          </div>
          
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Printify API Setup</h3>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Log in to your Printify account at <a href="https://printify.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">printify.com</a></li>
              <li>Navigate to My Profile &gt; Connections</li>
              <li>Generate a Personal Access Token</li>
              <li>Add the token to your .env file as <code className="bg-gray-100 p-1 rounded">PRINTIFY_API_KEY=your_token_here</code></li>
              <li>Restart the application</li>
              <li><strong>For deployment</strong>: Add <code className="bg-gray-100 p-1 rounded">PRINTIFY_API_KEY</code> to your deployment environment variables</li>
            </ol>
            <div className="mt-2 text-sm text-gray-500">
              <p>The Printify API allows you to access your Print on Demand products, create and publish items, and manage your store.</p>
              <p>Rate limits: 600 requests per minute globally, 200 requests per 30 minutes for product publishing.</p>
            </div>
          </div>
          
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Shopify API Setup</h3>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Log in to your Shopify admin dashboard</li>
              <li>Go to Apps &gt; App and sales channel settings</li>
              <li>Click "Develop apps for your store"</li>
              <li>Create a private app and set appropriate permissions for products, orders and inventory</li>
              <li>Add the following environment variables to your .env file:
                <ul className="list-disc ml-5 mt-1 space-y-1">
                  <li><code className="bg-gray-100 p-1 rounded">SHOPIFY_API_KEY=your_api_key</code></li>
                  <li><code className="bg-gray-100 p-1 rounded">SHOPIFY_API_PASSWORD=your_api_password</code></li>
                  <li><code className="bg-gray-100 p-1 rounded">SHOPIFY_SHOP_NAME=your_shop_name</code> (without the .myshopify.com part)</li>
                  <li><code className="bg-gray-100 p-1 rounded">SHOPIFY_API_VERSION=2023-07</code> (or the latest available)</li>
                  <li><code className="bg-gray-100 p-1 rounded">SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_token</code> (if using Storefront API)</li>
                </ul>
              </li>
              <li>Restart the application</li>
              <li><strong>For deployment</strong>: Add all these variables to your deployment environment</li>
            </ol>
            <div className="mt-2 text-sm text-gray-500">
              <p className="text-blue-700"><strong>Note:</strong> Without proper Shopify API credentials, the app will display demo products. For full functionality, configure these credentials in your deployment environment.</p>
              <p>The Shopify API allows you to connect to your existing Shopify store and manage products, inventory, and orders.</p>
              <p>Be mindful of Shopify API rate limits which vary by plan (typically 2-4 requests per second).</p>
            </div>
          </div>
          
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-2">API Usage Guidelines</h3>
            <ul className="list-disc ml-5 space-y-2">
              <li>Maintain a reliable internet connection when using the APIs</li>
              <li>Be mindful of rate limits to avoid temporary blocks</li>
              <li>For large operations (like bulk product creation), use scheduled jobs during off-peak hours</li>
              <li>Always test API changes in a development environment before applying to production</li>
              <li>Review the respective API documentation for detailed usage guidelines:
                <ul className="list-disc ml-5 mt-1">
                  <li><a href="https://developers.printify.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Printify API Docs</a></li>
                  <li><a href="https://shopify.dev/docs/api" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Shopify API Docs</a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <AlertDialogAction>I Understand</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}