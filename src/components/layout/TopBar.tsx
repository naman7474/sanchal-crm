"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useRouter } from "next/navigation";

export function TopBar() {
    const { profile, user, signOut } = useAuth();
    const { data: stats } = useDashboardStats();
    const router = useRouter();

    // Try profile.full_name first, then user metadata, then fallback
    const firstName =
        profile?.full_name?.split(" ")[0] ||
        (user?.user_metadata?.full_name as string)?.split(" ")[0] ||
        user?.email?.split("@")[0] ||
        "there";
    const expiringCount = stats?.expiring_30 ?? 0;

    async function handleLogout() {
        await signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <div className="bg-white px-4 md:px-6 py-3 md:py-4 border-b border-border flex justify-between items-center sticky top-0 z-10">
            <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold tracking-tight text-slate-900 leading-none truncate">
                    Hi, {firstName} 👋
                </h1>
                {expiringCount > 0 && (
                    <p className="text-xs md:text-sm text-slate-500 mt-1 truncate">
                        <strong className="text-orange-600 font-semibold">
                            {expiringCount} {expiringCount === 1 ? "policy" : "policies"}
                        </strong>{" "}expiring soon
                    </p>
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="bg-slate-100 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-700 w-8 h-8 md:w-10 md:h-10 shrink-0"
                onClick={handleLogout}
                title="Sign out"
            >
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                <span className="sr-only">Sign out</span>
            </Button>
        </div>
    );
}
