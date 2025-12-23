import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Code, 
  Settings, 
  Database, 
  Play, 
  LogOut, 
  Monitor, 
  Zap, 
  Package,
  Users,
  BarChart3,
  Terminal,
  Globe,
  Key,
  Workflow
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePrintifyShops } from "@/hooks/use-printify";
import ProductEditor from "@/components/admin/ProductEditor";
import CategoryManager from "@/components/admin/CategoryManager";
import OrderManager from "@/components/admin/OrderManager";
import ProductManager from "@/components/admin/ProductManager";
import EventManager from "@/components/admin/EventManager";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { data: shops, isLoading: shopsLoading } = usePrintifyShops();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    setLocation("/admin/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Product Manager</h1>
                  <p className="text-xs text-gray-500">SWDNN Admin Portal</p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="border-gray-300 hover:bg-gray-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Fixed overlapping with proper spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <Tabs defaultValue="products" className="w-full space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="flex min-w-full sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-1 justify-start sm:justify-center">
              <TabsTrigger value="products" className="text-xs sm:text-sm px-1 sm:px-2 py-2 min-w-0 whitespace-nowrap flex-shrink-0">
                <span className="hidden sm:inline">Product Editor</span>
                <span className="sm:hidden">Products</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm px-1 sm:px-2 py-2 min-w-0 whitespace-nowrap flex-shrink-0">
                <span className="hidden sm:inline">Categories</span>
                <span className="sm:hidden">Cats</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-xs sm:text-sm px-1 sm:px-2 py-2 min-w-0 whitespace-nowrap flex-shrink-0">
                <span className="hidden sm:inline">Orders</span>
                <span className="sm:hidden">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="text-xs sm:text-sm px-1 sm:px-2 py-2 min-w-0 whitespace-nowrap flex-shrink-0">
                <span className="hidden sm:inline">Events</span>
                <span className="sm:hidden">Events</span>
              </TabsTrigger>
              <TabsTrigger value="sync" className="text-xs sm:text-sm px-1 sm:px-2 py-2 min-w-0 whitespace-nowrap flex-shrink-0">
                <span className="hidden sm:inline">Sync & Pricing</span>
                <span className="sm:hidden">Sync</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="min-h-[600px]">
            <TabsContent value="products" className="mt-0 space-y-6">
              <ProductEditor />
            </TabsContent>
            
            <TabsContent value="categories" className="mt-0 space-y-6">
              <CategoryManager />
            </TabsContent>
            
            <TabsContent value="orders" className="mt-0 space-y-6">
              <OrderManager />
            </TabsContent>
            
            <TabsContent value="events" className="mt-0 space-y-6">
              <EventManager />
            </TabsContent>
            
            <TabsContent value="sync" className="mt-0 space-y-6">
              <ProductManager />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}