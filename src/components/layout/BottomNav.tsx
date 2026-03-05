"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Plus, FileText, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { QuickCreateCustomer } from "@/components/customers/QuickCreateCustomer";

export function BottomNav() {
    const pathname = usePathname();
    const [showCreate, setShowCreate] = useState(false);

    const navItems = [
        { name: "Home", href: "/", icon: LayoutDashboard },
        { name: "Clients", href: "/customers", icon: Users },
    ];

    const secondaryNavItems = [
        { name: "Policies", href: "/policies", icon: FileText },
        { name: "Reports", href: "/reports", icon: BarChart2 },
    ];

    return (
        <>
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

                {/* FAB (Floating Action Button) — directly creates new customer */}
                <div className="flex flex-col items-center justify-center -mt-6">
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(79,70,229,0.4)] hover:-translate-y-1 transition-all active:scale-95 active:shadow-none"
                    >
                        <Plus className="h-6 w-6" strokeWidth={2} />
                        <span className="sr-only">New Client</span>
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

            <QuickCreateCustomer open={showCreate} onOpenChange={setShowCreate} />
        </>
    );
}
