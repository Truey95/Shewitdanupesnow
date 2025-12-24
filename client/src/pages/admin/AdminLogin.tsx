import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        } else {
          throw new Error("Server error. Please check logs.");
        }
      }

      const result = await response.json();

      // Store the admin session
      localStorage.setItem("adminToken", result.token);

      toast({
        title: "Access Granted",
        description: "Welcome back to the command center.",
        className: "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200",
      });

      setLocation("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-yellow-100/30 rounded-full blur-[100px] mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white">
              <ShieldCheck className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Admin Access
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Authenticate to access the Kinetic Dashboard
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-100 text-red-800">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Username</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                        </div>
                        <Input
                          {...field}
                          className="pl-10 bg-white/50 border-gray-200 focus:border-amber-400 focus:ring-amber-200/50 rounded-xl h-11 transition-all"
                          placeholder="Enter your username"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                        </div>
                        <Input
                          {...field}
                          type="password"
                          className="pl-10 bg-white/50 border-gray-200 focus:border-amber-400 focus:ring-amber-200/50 rounded-xl h-11 transition-all"
                          placeholder="••••••••"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white shadow-lg shadow-gray-200/50 rounded-xl h-12 text-base font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Authenticating...
                  </div>
                ) : (
                  "Enter Dashboard"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs text-gray-400">
              Secure Environment • v2.0.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}