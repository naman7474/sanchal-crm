"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, BarChart2, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import Image from "next/image";

const mainNavItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clients", href: "/customers", icon: Users },
    { name: "Policies", href: "/policies", icon: FileText },
    { name: "Reports", href: "/reports", icon: BarChart2 },
    { name: "Documents", href: "/documents", icon: Folder },
];

export function Sidebar() {
    const pathname = usePathname();
    const { organization } = useAuth();

    const orgName = organization?.name || "My Agency";
    const orgInitial = orgName.charAt(0).toUpperCase();
    const logoUrl = organization?.logo_url;

    return (
        <div className="w-64 bg-slate-50 border-r border-border h-screen flex-col hidden md:flex sticky top-0 shrink-0">
            <div className="p-6 pb-4 flex-1">
                <Link href="/" className="flex items-center gap-3 px-2 mb-6 hover:opacity-90 transition-opacity">
                    {logoUrl ? (
                        <Image
                            src={logoUrl}
                            alt={orgName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100 p-0.5"
                            unoptimized
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {orgInitial}
                        </div>
                    )}
                    <span className="font-bold text-lg text-slate-900 tracking-tight truncate">{orgName}</span>
                </Link>

                <nav className="space-y-1">
                    {mainNavItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-150 ease-in-out text-sm font-medium",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Powered by Sanchal */}
            <div className="p-4 border-t border-slate-200">
                <p className="text-[11px] text-slate-400 text-center">
                    Powered by <span className="font-semibold text-indigo-500">Sanchal</span>
                </p>
            </div>
        </div>
    );
}
