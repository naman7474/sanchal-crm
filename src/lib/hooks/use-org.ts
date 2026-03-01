import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * Cached org_id hook - fetches once and caches indefinitely
 * Use this instead of fetching org_id in every mutation
 */
export function useOrgId() {
    return useQuery({
        queryKey: ["org-id"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("org_id")
                .single();

            if (error) throw error;
            return data.org_id as string;
        },
        staleTime: Infinity, // Never refetch - org_id doesn't change during session
        gcTime: Infinity,    // Keep in cache forever
    });
}

/**
 * Helper to get org_id synchronously from cache
 * Returns null if not yet loaded
 */
export function getOrgIdFromCache(queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>): string | null {
    return queryClient.getQueryData<string>(["org-id"]) ?? null;
}
