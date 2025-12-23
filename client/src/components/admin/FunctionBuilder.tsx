import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Code, 
  Play, 
  Save, 
  Plus, 
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomFunction {
  id: string;
  name: string;
  description: string;
  code: string;
  trigger: string;
  status: 'active' | 'inactive';
  lastRun?: string;
}

export default function FunctionBuilder() {
  const [functions, setFunctions] = useState<CustomFunction[]>([
    {
      id: '1',
      name: 'Auto Product Sync',
      description: 'Automatically sync new products from Printify to database',
      code: `// Auto sync new products
async function syncNewProducts() {
  const shops = await printify.getShops();
  for (const shop of shops) {
    const products = await printify.getProducts(shop.id);
    // Process and save products
    await database.saveProducts(products);
  }
}`,
      trigger: 'webhook',
      status: 'active',
      lastRun: '2 hours ago'
    }
  ]);

  const [selectedFunction, setSelectedFunction] = useState<CustomFunction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleCreateNew = () => {
    const newFunction: CustomFunction = {
      id: Date.now().toString(),
      name: 'New Function',
      description: 'Description of your custom function',
      code: `// Your custom function code here
async function customFunction() {
  // Implementation
}`,
      trigger: 'manual',
      status: 'inactive'
    };
    setFunctions([...functions, newFunction]);
    setSelectedFunction(newFunction);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (selectedFunction) {
      setFunctions(functions.map(f => 
        f.id === selectedFunction.id ? selectedFunction : f
      ));
      setIsEditing(false);
      toast({
        title: "Function saved",
        description: "Your custom function has been saved successfully",
      });
    }
  };

  const handleRun = async (func: CustomFunction) => {
    toast({
      title: "Function executing",
      description: `Running ${func.name}...`,
    });
    
    setTimeout(() => {
      toast({
        title: "Function completed",
        description: `${func.name} executed successfully`,
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Custom Functions</h2>
          <p className="text-muted-foreground">
            Create and manage custom functions for Printify integration
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Function
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Function List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Functions</CardTitle>
            <CardDescription>
              {functions.length} custom functions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {functions.map((func) => (
              <div
                key={func.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedFunction?.id === func.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setSelectedFunction(func)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{func.name}</h4>
                  <Badge variant={func.status === 'active' ? 'default' : 'secondary'}>
                    {func.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {func.description}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRun(func);
                    }}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {func.lastRun ? `Last run: ${func.lastRun}` : 'Never run'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Function Editor */}
        <Card className="lg:col-span-2">
          {selectedFunction ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedFunction.name}</CardTitle>
                    <CardDescription>{selectedFunction.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      {isEditing ? 'View' : 'Edit'}
                    </Button>
                    {isEditing && (
                      <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="code" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="logs">Logs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="code" className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="functionName">Function Name</Label>
                          <Input
                            id="functionName"
                            value={selectedFunction.name}
                            onChange={(e) => setSelectedFunction({
                              ...selectedFunction,
                              name: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="functionDescription">Description</Label>
                          <Input
                            id="functionDescription"
                            value={selectedFunction.description}
                            onChange={(e) => setSelectedFunction({
                              ...selectedFunction,
                              description: e.target.value
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="functionCode">Code</Label>
                          <Textarea
                            id="functionCode"
                            className="min-h-[300px] font-mono text-sm"
                            value={selectedFunction.code}
                            onChange={(e) => setSelectedFunction({
                              ...selectedFunction,
                              code: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{selectedFunction.code}</code>
                        </pre>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="config" className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="trigger">Trigger Type</Label>
                        <Select value={selectedFunction.trigger}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                            <SelectItem value="schedule">Scheduled</SelectItem>
                            <SelectItem value="event">Event-based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={selectedFunction.status}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="logs" className="space-y-4">
                    <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
                      <div>[2024-01-30 14:30:15] Function started</div>
                      <div>[2024-01-30 14:30:16] Fetching Printify shops...</div>
                      <div>[2024-01-30 14:30:17] Found 1 shop</div>
                      <div>[2024-01-30 14:30:18] Syncing products...</div>
                      <div>[2024-01-30 14:30:20] Successfully synced 5 products</div>
                      <div>[2024-01-30 14:30:20] Function completed</div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <Code className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No function selected</h3>
                <p className="text-muted-foreground">
                  Select a function from the list to view or edit its code
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}