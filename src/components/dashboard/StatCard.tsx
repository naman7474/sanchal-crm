import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string;
    change?: string;
    icon: ReactNode;
    accentClass: string;
}

export function StatCard({ label, value, change, icon, accentClass }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex-1 min-w-[160px]">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-[13px] text-slate-500 font-medium mb-2">{label}</div>
                    <div className="text-[28px] font-bold text-slate-900 tracking-tight leading-none">{value}</div>
                </div>
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", accentClass)}>
                    {icon}
                </div>
            </div>
            {change && (
                <div className={cn(
                    "mt-2 text-[13px] font-semibold",
                    change.startsWith("+") ? "text-emerald-600" : "text-rose-600"
                )}>
                    {change} <span className="text-slate-400 font-normal">vs last month</span>
                </div>
            )}
        </div>
    );
}
