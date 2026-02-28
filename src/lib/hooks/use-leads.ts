import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadInput } from "@/lib/types/database";

const supabase = createClient();

export function useLeads(search?: string, status?: string) {
    return useQuery({
        queryKey: ["leads", search, status],
        queryFn: async () => {
            let query = supabase
                .from("leads")
                .select("*")
                .order("created_at", { ascending: false });

            if (search) {
                query = query.or(
                    `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
                );
            }

            if (status) {
                query = query.eq("status", status);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Lead[];
        },
    });
}

export function useLead(id: string) {
    return useQuery({
        queryKey: ["lead", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("id", id)
                .single();
            if (error) throw error;
            return data as Lead;
        },
        enabled: !!id,
    });
}

export function useCreateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: Partial<LeadInput>) => {
            const { data: profile } = await supabase
                .from("profiles")
                .select("org_id")
                .single();

            const { data, error } = await supabase
                .from("leads")
                .insert({
                    ...input,
                    org_id: profile!.org_id,
                })
                .select()
                .single();

            if (error) throw error;
            return data as Lead;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
}

export function useUpdateLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...input }: Partial<LeadInput> & { id: string }) => {
            const { data, error } = await supabase
                .from("leads")
                .update(input)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Lead;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["lead", data.id] });
        },
    });
}

export function useDeleteLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("leads").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
    });
}
