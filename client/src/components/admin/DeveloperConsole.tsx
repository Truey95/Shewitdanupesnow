import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Terminal, 
  Play, 
  Copy, 
  Download,
  Code
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperConsole() {
  const [apiEndpoint, setApiEndpoint] = useState("/api/printify/shops");
  const [httpMethod, setHttpMethod] = useState("GET");
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleApiTest = async () => {
    setIsLoading(true);
    try {
      const options: RequestInit = {
        method: httpMethod,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (httpMethod !== "GET" && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(apiEndpoint, options);
      const data = await res.json();
      
      setResponse(JSON.stringify(data, null, 2));
      
      toast({
        title: "API request completed",
        description: `${httpMethod} ${apiEndpoint} - ${res.status}`,
      });
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "API request failed",
        description: "Check the console for error details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard",
    });
  };

  const codeExamples = {
    javascript: `// Fetch Printify shops
const response = await fetch('/api/printify/shops');
const shops = await response.json();

// Create a new product
const productData = {
  title: "Custom T-Shirt",
  description: "A beautiful custom t-shirt",
  // ... other product properties
};

const createResponse = await fetch('/api/printify/shops/123/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(productData)
});`,
    curl: `# Get all shops
curl -X GET "https://your-domain.com/api/printify/shops" \\
  -H "Content-Type: application/json"

# Create a product
curl -X POST "https://your-domain.com/api/printify/shops/123/products" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Custom T-Shirt",
    "description": "A beautiful custom t-shirt"
  }'`,
    python: `import requests

# Fetch shops
response = requests.get('https://your-domain.com/api/printify/shops')
shops = response.json()

# Create product
product_data = {
    'title': 'Custom T-Shirt',
    'description': 'A beautiful custom t-shirt'
}
response = requests.post(
    'https://your-domain.com/api/printify/shops/123/products',
    json=product_data
)`
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Developer Console</h2>
        <p className="text-muted-foreground">
          Test API endpoints and explore integration capabilities
        </p>
      </div>

      <Tabs defaultValue="api-tester" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-tester">API Tester</TabsTrigger>
          <TabsTrigger value="code-examples">Code Examples</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="api-tester">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Builder */}
            <Card>
              <CardHeader>
                <CardTitle>API Request Builder</CardTitle>
                <CardDescription>
                  Build and test API requests directly from the console
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="method">Method</Label>
                    <Select value={httpMethod} onValueChange={setHttpMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={apiEndpoint}
                      onChange={(e) => setApiEndpoint(e.target.value)}
                      placeholder="/api/printify/shops"
                    />
                  </div>
                </div>

                {httpMethod !== "GET" && (
                  <div>
                    <Label htmlFor="requestBody">Request Body (JSON)</Label>
                    <Textarea
                      id="requestBody"
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{"title": "Product Name", "description": "Product description"}'
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                )}

                <Button 
                  onClick={handleApiTest} 
                  disabled={isLoading}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isLoading ? "Sending..." : "Send Request"}
                </Button>
              </CardContent>
            </Card>

            {/* Response Viewer */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Response</CardTitle>
                    <CardDescription>
                      API response data and status
                    </CardDescription>
                  </div>
                  {response && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(response)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg min-h-[300px] overflow-auto">
                  <pre className="text-sm">
                    {response || "No response yet. Send a request to see the output here."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="code-examples">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>
                  Ready-to-use code snippets for different programming languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="javascript" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>

                  {Object.entries(codeExamples).map(([lang, code]) => (
                    <TabsContent key={lang} value={lang}>
                      <div className="relative">
                        <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Comprehensive guide to available endpoints and their usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Printify Integration</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="font-mono text-sm">GET /api/printify/shops</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Retrieve all connected Printify shops
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="font-mono text-sm">GET /api/printify/shops/{`{shopId}`}/products</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get all products for a specific shop
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="font-mono text-sm">POST /api/printify/shops/{`{shopId}`}/products</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create a new product in the specified shop
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="font-mono text-sm">POST /api/printify/shops/{`{shopId}`}/products/{`{productId}`}/publishing_actions/publish</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Publish a product to connected sales channels
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-8">Shopify Integration</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="font-mono text-sm">GET /api/shopify/products</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Retrieve products from connected Shopify store
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <div className="font-mono text-sm">GET /api/shopify/collections</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get all collections from Shopify store
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-8">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  All API endpoints require proper authentication. Make sure you have the necessary 
                  API keys configured for Printify and Shopify integrations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}