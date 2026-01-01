import { Link, useLocation } from "wouter";
import { ShoppingBag, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useState, useRef, useEffect } from "react";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const cart = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Function to close mobile menu when link is clicked
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Secret admin access - requires 5 clicks
  const handleSecretAdminAccess = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);
    
    if (newCount >= 5) {
      setLocation("/admin/login");
      setAdminClickCount(0); // Reset counter
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else {
      // Clear existing timeout to prevent multiple timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Reset counter after 3 seconds of inactivity
      timeoutRef.current = setTimeout(() => {
        setAdminClickCount(0);
        timeoutRef.current = null;
      }, 3000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const collections = [
    { name: 'SWDNN', fullName: 'She Wit Da Nupes Now', color: 'text-[#f5e6d3] hover:text-[#e5d6c3]', href: '/collections/swdnn' },
    { name: 'HWDKN', fullName: 'He Wit Da K\'s Now', color: 'text-pink-500 hover:text-pink-400', href: '/collections/hwdkn' },
    { name: 'HWDRN', fullName: 'He Wit Da Redz Now', color: 'text-red-600 hover:text-red-500', href: '/collections/hwdrn' },
    { name: 'HWDZN', fullName: 'He Wit Da Zetas Now', color: 'text-blue-500 hover:text-blue-400', href: '/collections/hwdzn' },
    { name: 'HWDPN', fullName: 'He Wit Da Poodles Now', color: 'text-yellow-400 hover:text-yellow-300', href: '/collections/hwdpn' }
  ];

  return (
    <>
      {/* Main Navigation */}
      <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 relative">
        {/* Secret Admin Access - Invisible clickable area in top-right corner */}
        <div
          onClick={handleSecretAdminAccess}
          className="absolute top-0 right-0 w-16 h-16 opacity-0 cursor-pointer z-50"
          title=""
        />
        <div className="container mx-auto px-4">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <div className="text-center">
                <Link href="/" className="text-base sm:text-xl font-serif bg-gradient-to-r from-red-800 via-red-600 to-[#f5e6d3] bg-clip-text text-transparent font-bold block">
                  SHE WIT DA NUPES NOW
                </Link>
                <p className="text-xs text-gray-400 italic font-bold">SHE LIKE YOU BUT SHE LOVE ME</p>
              </div>
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative text-white">
                  <ShoppingBag className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-white text-black rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Content */}
            {isMobileMenuOpen && (
              <div className="lg:hidden bg-black border-t border-gray-800 py-4 px-2">
                <div className="space-y-2">
                  <Link 
                    href="/new-arrivals" 
                    className="block text-white px-4 py-3 rounded-md hover:bg-gray-900 transition-colors"
                    onClick={handleMobileLinkClick}
                  >
                    NEW ARRIVALS
                  </Link>
                  <Link 
                    href="/products" 
                    className="block text-white px-4 py-3 rounded-md hover:bg-gray-900 transition-colors"
                    onClick={handleMobileLinkClick}
                  >
                    Our Products
                  </Link>
                  <Link 
                    href="/tours-and-events" 
                    className="block text-white px-4 py-3 rounded-md hover:bg-gray-900 transition-colors"
                    onClick={handleMobileLinkClick}
                  >
                    Tours & Events
                  </Link>
                  {collections.map((collection) => (
                    <Link 
                      key={collection.name} 
                      href={collection.href} 
                      className={`block px-4 py-3 rounded-md hover:bg-gray-900 transition-colors ${collection.color}`}
                      onClick={handleMobileLinkClick}
                    >
                      <span className="font-medium">{collection.name}</span>
                      <span className="block text-sm opacity-75">{collection.fullName}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex flex-col items-center">
            {/* Brand Logo */}
            <div className="text-center py-4">
              <Link href="/" className="text-2xl font-serif bg-gradient-to-r from-red-800 via-red-600 to-[#f5e6d3] bg-clip-text text-transparent font-bold hover:opacity-90 transition-opacity block">
                SHE WIT DA NUPES NOW
              </Link>
              <p className="text-sm text-gray-400 italic mt-1 font-bold">SHE LIKE YOU BUT SHE LOVE ME</p>
            </div>
            


            {/* Main Navigation Items */}
            <div className="flex items-center justify-between w-full py-4">
              <div className="flex items-center space-x-6">
                {/* Products Link */}
                <Link href="/products" className="text-white font-medium hover:text-gray-300 transition-colors">
                  Our Products
                </Link>
                
                {/* Tours and Events Link */}
                <Link href="/tours-and-events" className="text-white font-medium hover:text-gray-300 transition-colors">
                  Tours & Events
                </Link>

                {/* New Arrivals Dropdown */}
                <NavigationMenu
                  value={isMenuOpen ? "open" : "closed"}
                  onValueChange={(value) => setIsMenuOpen(value === "open")}
                >
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="bg-black text-white hover:bg-gray-900 transition-colors duration-200">
                        NEW ARRIVALS
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="absolute top-full left-0 z-[100] w-[800px] bg-black border border-gray-800 shadow-xl animate-in fade-in-80 slide-in-from-top-5">
                        <div className="p-6">
                          <h3 className="text-lg font-serif text-white mb-6">New Arrivals</h3>
                          <div className="grid grid-cols-3 gap-4">
                            {collections.map((collection) => {
                              const { href, name, fullName, color } = collection;
                              return (
                                <div 
                                  key={name} 
                                  className="group block relative overflow-hidden cursor-pointer"
                                  onClick={() => {
                                    setIsMenuOpen(false);
                                    window.location.href = href;
                                  }}
                                >
                                  <div className="relative h-48">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                                      <div className="absolute bottom-4 left-4">
                                        <h4 className={`font-serif text-lg ${color}`}>{name}</h4>
                                        <p className="text-gray-300 text-sm">{fullName}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>

                {/* Collection Links */}
                {collections.map((collection) => (
                  <Link 
                    key={collection.name} 
                    href={collection.href} 
                    className={`${collection.color} font-medium transition-colors duration-200`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>

              {/* Right Side Icons */}
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-gray-900 transition-colors duration-200">
                  <Search className="h-5 w-5" />
                </Button>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative text-white hover:bg-gray-900 transition-colors duration-200">
                    <ShoppingBag className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-white text-black rounded-full flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Button>
                </Link>

              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}