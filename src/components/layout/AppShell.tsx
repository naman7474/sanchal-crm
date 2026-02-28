"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/providers/AuthProvider";
import type { ReactNode } from "react";

const PUBLIC_PATHS = ["/login", "/signup"];

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { isLoading, user } = useAuth();

    const isPublicPage = PUBLIC_PATHS.includes(pathname);

    // For public pages (login/signup), render without shell
    if (isPublicPage) {
        return <>{children}</>;
    }

    // Show the shell layout immediately — only the content area shows a loader
    // This means the sidebar, topbar, and bottom nav appear instantly
    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {isLoading ? (
                    // Minimal inline skeleton while auth loads — no full-screen blocker
                    <>
                        <div className="bg-white px-4 md:px-6 py-3 md:py-4 border-b border-border flex justify-between items-center sticky top-0 z-10">
                            <div className="h-6 w-40 bg-slate-100 rounded animate-pulse" />
                            <div className="flex gap-1.5">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg animate-pulse" />
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg animate-pulse" />
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-lg animate-pulse" />
                            </div>
                        </div>
                        <main className="flex-1 overflow-y-auto p-4 md:p-6">
                            <div className="max-w-[1280px] mx-auto space-y-4">
                                <div className="h-7 w-32 bg-slate-100 rounded animate-pulse" />
                                <div className="h-4 w-56 bg-slate-100 rounded animate-pulse" />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                    <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
                                    <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
                                    <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
                                </div>
                            </div>
                        </main>
                    </>
                ) : (
                    <>
                        <TopBar />
                        <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0 relative z-0">
                            {children}
                        </main>
                    </>
                )}
                <BottomNav />
            </div>
        </div>
    );
}
