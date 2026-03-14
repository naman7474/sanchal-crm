"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile, Organization } from "@/lib/types/database";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    organization: Organization | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    organization: null,
    isLoading: true,
    signOut: async () => { },
});

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();
    const queryClient = useQueryClient();

    useEffect(() => {
        let isMounted = true;

        // Listen for auth changes - this handles ALL session state including initial load
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: any, newSession: any) => {
                if (!isMounted) return;

                setSession(newSession);
                setUser(newSession?.user ?? null);

                // Handle all relevant auth events that need profile/org data
                if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && newSession?.user) {
                    await fetchProfileAndOrg(newSession.user.id);
                    // Invalidate all queries so they refetch with fresh auth
                    queryClient.invalidateQueries();
                    setIsLoading(false);
                } else if (event === "SIGNED_OUT") {
                    setProfile(null);
                    setOrganization(null);
                    queryClient.clear();
                    setIsLoading(false);
                } else {
                    // No session on initial load
                    setIsLoading(false);
                }
            }
        );

        // Trigger the initial session check - this will fire INITIAL_SESSION event
        supabase.auth.getSession();

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchProfileAndOrg(userId: string) {
        try {
            // Single query: fetch profile with org joined
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*, organizations(*)")
                .eq("id", userId)
                .single();

            if (profileData) {
                const { organizations: orgData, ...profileOnly } = profileData as Record<string, unknown>;
                const typedProfile = profileOnly as unknown as Profile;
                setProfile(typedProfile);
                if (orgData) {
                    setOrganization(orgData as unknown as Organization);
                }
                // Pre-cache org_id for mutations (avoids N+1 queries)
                if (typedProfile.org_id) {
                    queryClient.setQueryData(["org-id"], typedProfile.org_id);
                }
            }
        } catch (error) {
            console.error("Error fetching profile/org:", error);
        }
    }

    async function signOut() {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        setOrganization(null);
        // Clear cached org_id
        queryClient.removeQueries({ queryKey: ["org-id"] });
    }

    return (
        <AuthContext.Provider value={{ user, session, profile, organization, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
