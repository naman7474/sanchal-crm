import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Customer, CustomerInput } from "@/lib/types/database";
import { getOrgIdFromCache } from "./use-org";

const supabase = createClient();
const DEFAULT_LIMIT = 100; // Prevent unbounded queries

export function useCustomers(search?: string, status?: string, limit: number = DEFAULT_LIMIT) {
    return useQuery({
        queryKey: ["customers", search, status, limit],
        queryFn: async () => {
            let query = supabase
                .from("customers")
                .select("*, policies(count)")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (search) {
                query = query.or(
                    `customer_name.ilike.%${search}%,mobile_no.ilike.%${search}%,email.ilike.%${search}%`
                );
            }

            if (status) {
                query = query.eq("status", status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as (Customer & { policies: { count: number }[] })[];
        },
    });
}

export function useCustomer(id: string) {
    return useQuery({
        queryKey: ["customer", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customers")
                .select("*")
                .eq("id", id)
                .single();
            if (error) throw error;
            return data as Customer;
        },
        enabled: !!id,
    });
}

export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Partial<CustomerInput>) => {
            // Try to get org_id from cache first (avoids extra DB call)
            let orgId = getOrgIdFromCache(queryClient);

            if (!orgId) {
                // Fallback: fetch if not cached
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("org_id")
                    .single();
                orgId = profile!.org_id;
                // Cache it for future mutations
                queryClient.setQueryData(["org-id"], orgId);
            }

            const { data, error } = await supabase
                .from("customers")
                .insert({
                    ...input,
                    org_id: orgId,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Customer;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...input }: Partial<CustomerInput> & { id: string }) => {
            const { data, error } = await supabase
                .from("customers")
                .update(input)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Customer;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
            queryClient.invalidateQueries({ queryKey: ["customer", data.id] });
        },
    });
}

export function useDeleteCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("customers").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] });
        },
    });
}
