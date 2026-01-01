import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
    username: string;
    role: string;
    isBypass?: boolean;
}

interface AdminAuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AdminUser | null;
    login: (token: string, userData: AdminUser) => void;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [user, setUser] = useState<AdminUser | null>(null);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem("adminToken");

            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                setUser(null);
                return;
            }

            try {
                const response = await fetch("/api/admin/verify", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setIsAuthenticated(true);
                        setUser(data.user);
                    } else {
                        throw new Error("Token verification failed");
                    }
                } else {
                    throw new Error("Token verification failed");
                }
            } catch (error) {
                console.error("Auth verification error:", error);
                localStorage.removeItem("adminToken");
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = (token: string, userData: AdminUser) => {
        localStorage.setItem("adminToken", token);
        setIsAuthenticated(true);
        setUser(userData);
        setLocation("/admin/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("adminToken");
        setIsAuthenticated(false);
        setUser(null);
        toast({
            title: "Logged out",
            description: "You have been successfully logged out",
        });
        setLocation("/admin/login");
    };

    return (
        <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuthContext() {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error("useAdminAuthContext must be used within an AdminAuthProvider");
    }
    return context;
}
