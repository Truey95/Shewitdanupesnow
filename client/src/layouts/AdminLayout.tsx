import { ReactNode } from "react";
import { useLocation } from "wouter";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    RefreshCw,
    Tags
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [location, setLocation] = useLocation();
    const { logout } = useAdminAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard", active: location === "/admin/dashboard" },
        { icon: Package, label: "Products", href: "/admin/products", active: location === "/admin/products" },
        { icon: Tags, label: "Categories", href: "/admin/categories", active: location === "/admin/categories" },
        { icon: ShoppingCart, label: "Orders", href: "/admin/orders", active: location === "/admin/orders" },
        { icon: Calendar, label: "Events", href: "/admin/events", active: location === "/admin/events" },
        { icon: RefreshCw, label: "Sync & Pricing", href: "/admin/sync", active: location === "/admin/sync" },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:transform-none flex flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-50 rounded-xl flex items-center justify-center border border-white shadow-sm">
                            <Package className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 leading-tight">Nupe Style</h1>
                            <p className="text-xs text-gray-500">Admin Portal</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.href}
                            onClick={() => {
                                setLocation(item.href);
                                setSidebarOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                item.active
                                    ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md shadow-gray-200"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                item.active ? "text-amber-400" : "text-gray-400 group-hover:text-amber-500"
                            )} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-y-auto h-screen">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-semibold text-gray-900">Dashboard</span>
                    <div className="w-6" /> {/* Spacer */}
                </div>

                <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
