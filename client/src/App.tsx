import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import TryItOn from "@/pages/TryItOn";
import NewArrivals from "@/pages/NewArrivals";
import NotFound from "@/pages/not-found";
import ProductUpload from "@/pages/admin/ProductUpload";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ShopifyProducts from "@/pages/ShopifyProducts";
import ShopifyProductDetail from "@/pages/ShopifyProductDetail";
import Collections from "@/pages/Collections";
import ToursAndEvents from "@/pages/ToursAndEvents";
import SWDNN from "@/pages/collections/SWDNN";
import HWDKN from "@/pages/collections/HWDKN";
import HWDRN from "@/pages/collections/HWDRN";
import HWDZN from "@/pages/collections/HWDZN";
import HWDPN from "@/pages/collections/HWDPN";
import { AdminAuthProvider } from "@/context/admin-auth-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/try-it-on" component={TryItOn} />
      <Route path="/new-arrivals" component={NewArrivals} />

      {/* Admin Routes */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />

      {/* All Dashboard routes handled by AdminDashboard component which uses internal routing based on path */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminDashboard} />
      <Route path="/admin/categories" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminDashboard} />
      <Route path="/admin/events" component={AdminDashboard} />
      <Route path="/admin/sync" component={AdminDashboard} />

      {/* Shopify Routes */}
      <Route path="/shopify" component={ShopifyProducts} />
      <Route path="/shopify/product/:productId" component={ShopifyProductDetail} />

      {/* Collection Routes */}
      <Route path="/collections" component={Collections} />
      <Route path="/collections/swdnn" component={SWDNN} />
      <Route path="/collections/hwdkn" component={HWDKN} />
      <Route path="/collections/hwdrn" component={HWDRN} />
      <Route path="/collections/hwdzn" component={HWDZN} />
      <Route path="/collections/hwdpn" component={HWDPN} />

      {/* Tours and Events Route */}
      <Route path="/tours-and-events" component={ToursAndEvents} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <Navigation />
      <main className="min-h-screen bg-background">
        <AdminAuthProvider>
          <Router />
        </AdminAuthProvider>
      </main>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;