"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Plus, Target, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function BottomNav() {
    const pathname = usePathname();
    const [showMenu, setShowMenu] = useState(false);

    const navItems = [
        { name: "Home", href: "/", icon: LayoutDashboard },
        { name: "Clients", href: "/customers", icon: Users },
    ];

    const secondaryNavItems = [
        { name: "Leads", href: "/leads", icon: Target },
        { name: "Reports", href: "/reports", icon: BarChart2 },
    ];

    const quickActions = [
        { name: "New Client", href: "/customers/new" },
        { name: "New Policy", href: "/policies/new" },
        { name: "New Lead", href: "/leads?add=true" },
    ];

    return (
        <>
            {/* Quick Action Menu Overlay */}
            {showMenu && (
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMenu(false)}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center animate-in fade-in slide-in-from-bottom-4 duration-200">
                        {quickActions.map(action => (
                            <Link
                                key={action.href}
                                href={action.href}
                                onClick={() => setShowMenu(false)}
                                className="bg-white text-slate-900 px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors whitespace-nowrap"
                            >
                                {action.name}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Nav Bar */}
            <div className="bg-white border-t border-border flex justify-around items-end pt-2 pb-5 px-0 md:hidden fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 min-w-[64px]"
                        >
                            <item.icon
                                className={cn(
                                    "h-[22px] w-[22px]",
                                    isActive ? "text-primary fill-primary/10" : "text-slate-400"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px]",
                                    isActive ? "text-primary font-semibold" : "text-slate-400 font-medium"
                                )}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}

                {/* FAB (Floating Action Button) */}
                <div className="flex flex-col items-center justify-center -mt-6">
                    <button
                        onClick={() => setShowMenu(prev => !prev)}
                        className={cn(
                            "w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(79,70,229,0.4)] hover:-translate-y-1 transition-all active:scale-95 active:shadow-none",
                            showMenu && "rotate-45"
                        )}
                    >
                        <Plus className="h-6 w-6" strokeWidth={2} />
                        <span className="sr-only">Add New</span>
                    </button>
                </div>

                {secondaryNavItems.map((item) => {
                    const isActive = pathname?.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 min-w-[64px]"
                        >
                            <item.icon
                                className={cn(
                                    "h-[22px] w-[22px]",
                                    isActive ? "text-primary fill-primary/10" : "text-slate-400"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px]",
                                    isActive ? "text-primary font-semibold" : "text-slate-400 font-medium"
                                )}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
