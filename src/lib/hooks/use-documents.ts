import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Document as DocType, DocumentInput } from "@/lib/types/database";
import { getOrgIdFromCache } from "./use-org";

const supabase = createClient();
const DEFAULT_LIMIT = 100;

export function useDocuments(customerId?: string, limit: number = DEFAULT_LIMIT) {
    return useQuery({
        queryKey: ["documents", customerId, limit],
        queryFn: async () => {
            let query = supabase
                .from("documents")
                .select("*, customers(customer_name)")
                .order("created_at", { ascending: false })
                .limit(limit);

            if (customerId) {
                query = query.eq("customer_id", customerId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as (DocType & { customers: { customer_name: string } | null })[];
        },
    });
}

export function useUploadDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            file,
            customerId,
            policyId,
            documentType,
            notes,
        }: {
            file: File;
            customerId: string;
            policyId?: string;
            documentType: string;
            notes?: string;
        }) => {
            // Try to get org_id from cache first (avoids extra DB call)
            let orgId = getOrgIdFromCache(queryClient);

            if (!orgId) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("org_id")
                    .single();
                orgId = profile!.org_id;
                queryClient.setQueryData(["org-id"], orgId);
            }
            const filePath = `${orgId}/${customerId}/${Date.now()}_${file.name}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Insert DB row
            const { data, error: insertError } = await supabase
                .from("documents")
                .insert({
                    org_id: orgId,
                    customer_id: customerId,
                    policy_id: policyId || null,
                    document_type: documentType,
                    document_name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type,
                    notes: notes || null,
                } as DocumentInput & { org_id: string })
                .select()
                .single();

            if (insertError) throw insertError;
            return data as DocType;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        },
    });
}

export function useDocumentUrl(filePath: string) {
    return useQuery({
        queryKey: ["document-url", filePath],
        queryFn: async () => {
            const { data, error } = await supabase.storage
                .from("documents")
                .createSignedUrl(filePath, 3600); // 1 hour

            if (error) throw error;
            return data.signedUrl;
        },
        enabled: !!filePath,
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from("documents")
                .remove([filePath]);
            if (storageError) throw storageError;

            // Delete DB row
            const { error: dbError } = await supabase
                .from("documents")
                .delete()
                .eq("id", id);
            if (dbError) throw dbError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
        },
    });
}
