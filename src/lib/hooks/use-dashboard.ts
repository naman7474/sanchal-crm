import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DashboardStats, ExpiringPolicy, Lead } from "@/lib/types/database";

const supabase = createClient();

export function useDashboardStats() {
    return useQuery({
        queryKey: ["dashboard", "stats"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("v_dashboard_stats")
                .select("*")
                .single();

            if (error) {
                // If the view returns no data (no policies yet), return defaults
                if (error.code === "PGRST116") {
                    return {
                        active_policies: 0,
                        expiring_30: 0,
                        expired: 0,
                        current_month_premium: 0,
                        current_month_commission: 0,
                        current_month_profit: 0,
                    } as DashboardStats;
                }
                throw error;
            }
            return data as DashboardStats;
        },
    });
}

export function useExpiringPolicies(days: number = 30) {
    return useQuery({
        queryKey: ["expiring-policies", days],
        queryFn: async () => {
            let query = supabase
                .from("v_expiring_policies")
                .select("*")
                .order("end_date", { ascending: true });

            if (days === 7) {
                query = query.in("urgency", ["EXPIRED", "CRITICAL"]);
            } else if (days === 30) {
                query = query.in("urgency", ["EXPIRED", "CRITICAL", "EXPIRING_30"]);
            }
            // else: all within 90 days (the view's default)

            const { data, error } = await query;
            if (error) throw error;
            return (data ?? []) as ExpiringPolicy[];
        },
    });
}

export function useTodayFollowUps() {
    return useQuery({
        queryKey: ["dashboard", "follow-ups"],
        queryFn: async () => {
            const today = new Date().toISOString().split("T")[0];
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("follow_up_date", today)
                .not("status", "in", '("converted","lost")')
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data ?? []) as Lead[];
        },
    });
}

export function useRecentActivity() {
    return useQuery({
        queryKey: ["dashboard", "activity"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("activity_log")
                .select("*, profiles(full_name)")
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) throw error;
            return data ?? [];
        },
    });
}
