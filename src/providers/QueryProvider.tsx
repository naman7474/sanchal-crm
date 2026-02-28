"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000,        // 5 minutes — data stays fresh
                        gcTime: 10 * 60 * 1000,           // 10 minutes — keep cache in memory
                        refetchOnWindowFocus: false,
                        refetchOnMount: false,             // Don't refetch if cache is fresh
                        retry: 1,                          // Only retry once on failure
                        refetchOnReconnect: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
