import { useAdminAuthContext } from "@/context/admin-auth-context";

// Re-export the context hook as useAdminAuth for backward compatibility and convenience
export function useAdminAuth() {
    return useAdminAuthContext();
}
