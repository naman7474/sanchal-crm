import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Policy, PolicyInput } from "@/lib/types/database";

const supabase = createClient();

export function usePolicies(search?: string, customerId?: string) {
    return useQuery({
        queryKey: ["policies", search, customerId],
        queryFn: async () => {
            let query = supabase
                .from("policies")
                .select("*, customers!inner(customer_name, mobile_no, email)")
                .order("created_at", { ascending: false });

            if (customerId) {
                query = query.eq("customer_id", customerId);
            }

            if (search) {
                query = query.or(
                    `policy_no.ilike.%${search}%,company_name.ilike.%${search}%,product.ilike.%${search}%,customers.customer_name.ilike.%${search}%`
                );
            }

            const { data, error } = await query;
            if (error) throw error;

            // Flatten customer info into each policy record
            return (data ?? []).map((p) => {
                const record = p as Record<string, unknown>;
                const customers = record.customers as { customer_name: string; mobile_no: string; email: string } | null;
                return {
                    ...record,
                    customer_name: customers?.customer_name,
                    mobile_no: customers?.mobile_no,
                    customer_email: customers?.email,
                    customers: undefined,
                } as unknown as Policy;
            });
        },
    });
}

export function usePolicy(id: string) {
    return useQuery({
        queryKey: ["policy", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("policies")
                .select("*, customers(customer_name, mobile_no, email)")
                .eq("id", id)
                .single();
            if (error) throw error;
            return data as Policy;
        },
        enabled: !!id,
    });
}

export function useCreatePolicy() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Partial<PolicyInput>) => {
            const { data: profile } = await supabase
                .from("profiles")
                .select("org_id")
                .single();

            // Auto-calculate commission fields
            const netOd = input.net_od_premium || 0;
            const commPct = input.commission_percent || 0;
            const beforeTds = netOd * (commPct / 100);
            const tds = beforeTds * 0.02; // 2% TDS standard rate
            const commission = beforeTds - tds;

            const subCommPct = input.sub_commission_percent || 0;
            const subBeforeTds = netOd * (subCommPct / 100);
            const subTds = subBeforeTds * 0.02;
            const subCommission = subBeforeTds - subTds;

            const profit = commission - subCommission;

            const { data, error } = await supabase
                .from("policies")
                .insert({
                    ...input,
                    org_id: profile!.org_id,
                    before_tds: beforeTds,
                    tds_amount: tds,
                    commission: commission,
                    sub_before_tds: subBeforeTds,
                    sub_tds_amount: subTds,
                    sub_commission: subCommission,
                    profit: profit,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Policy;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["policies"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["expiring-policies"] });
        },
    });
}

export function useUpdatePolicy() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...input }: Partial<PolicyInput> & { id: string }) => {
            const { data, error } = await supabase
                .from("policies")
                .update(input)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Policy;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["policies"] });
            queryClient.invalidateQueries({ queryKey: ["policy", data.id] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}
