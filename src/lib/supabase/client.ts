import { createBrowserClient } from "@supabase/ssr";

// Singleton — reuse the same client instance across the entire app
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
    if (!client) {
        client = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return client;
}
