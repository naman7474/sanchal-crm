"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar as CalendarIcon, Filter, Download, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useExpiringPolicies } from "@/lib/hooks/use-dashboard";

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number | null | undefined): string {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
}

export default function ReportsPage() {
    const [period, setPeriod] = useState(30);
    const [searchQuery, setSearchQuery] = useState("");
    const { data: allPolicies, isLoading } = useExpiringPolicies(period === 7 ? 7 : period === 30 ? 30 : 90);

    // Client-side search filter
    const policies = allPolicies?.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return p.customer_name?.toLowerCase().includes(q) ||
            p.product?.toLowerCase().includes(q) ||
            p.company_name?.toLowerCase().includes(q) ||
            p.policy_no?.toLowerCase().includes(q);
    }) ?? [];

    function handleExport() {
        if (!policies.length) return;
        const headers = ["Client", "Phone", "Product", "Company", "Premium", "Expiry Date", "Days Left"];
        const rows = policies.map(p => [
            p.customer_name, p.mobile_no || "", p.product, p.company_name,
            p.net_od_premium.toString(), p.end_date, p.days_until_expiry.toString()
        ]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expiring_policies_${period}d.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Expiring Policies</h1>
                    <p className="text-sm text-slate-500 mt-1">Track and manage upcoming renewals</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="bg-white border-slate-200 text-slate-700 w-full md:w-auto h-11">
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search customer or policy..."
                        className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-indigo-600 transition-colors h-11"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {[7, 30, 90].map(d => (
                        <Button
                            key={d}
                            variant={period === d ? "default" : "outline"}
                            className={`flex-1 md:flex-none h-11 ${period === d ? "bg-indigo-600 text-white" : "bg-white border-slate-200 text-slate-700"}`}
                            onClick={() => setPeriod(d)}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" /> {d} Days
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                </div>
            ) : !policies.length ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-4xl mb-3">🎉</p>
                    <p className="text-slate-900 font-semibold mb-1">No expiring policies</p>
                    <p className="text-sm text-slate-500">No policies expiring in the next {period} days</p>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {policies.map(policy => (
                            <div key={policy.id} className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-[16px] text-slate-900">{policy.customer_name}</h3>
                                        <p className="text-[13px] text-slate-500 mt-0.5">{policy.product} · {policy.company_name}</p>
                                    </div>
                                    <Badge variant={policy.days_until_expiry <= 3 ? "destructive" : "secondary"} className="whitespace-nowrap">
                                        {policy.days_until_expiry <= 0 ? "Expired" : `${policy.days_until_expiry} days left`}
                                    </Badge>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center mb-4 text-sm">
                                    <div>
                                        <span className="text-slate-500 block text-xs mb-0.5">Premium</span>
                                        <span className="font-semibold text-slate-900">{formatCurrency(policy.net_od_premium)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-500 block text-xs mb-0.5">Expiry Date</span>
                                        <span className="font-semibold text-slate-900">{formatDate(policy.end_date)}</span>
                                    </div>
                                </div>

                                {policy.mobile_no && (
                                    <Button className="w-full bg-[#25D366] hover:bg-[#20BE5B] text-white h-11" asChild>
                                        <a
                                            href={`https://wa.me/91${policy.mobile_no?.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi ${policy.customer_name}, your ${policy.product} policy is expiring on ${formatDate(policy.end_date)}. Please contact us for renewal.`)}`}
                                            target="_blank" rel="noopener noreferrer"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" /> Send Reminder
                                        </a>
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[13px] uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-xl">Client</th>
                                    <th className="px-6 py-4">Policy Details</th>
                                    <th className="px-6 py-4">Premium</th>
                                    <th className="px-6 py-4">Expiry Date</th>
                                    <th className="px-6 py-4 text-right rounded-tr-xl">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {policies.map((policy) => (
                                    <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900">{policy.customer_name}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">{policy.mobile_no || ""}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{policy.product}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">{policy.company_name}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{formatCurrency(policy.net_od_premium)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{formatDate(policy.end_date)}</span>
                                                <Badge variant={policy.days_until_expiry <= 3 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 h-5">
                                                    {policy.days_until_expiry <= 0 ? "Expired" : `${policy.days_until_expiry}d`}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {policy.mobile_no && (
                                                <Button size="sm" className="bg-[#25D366] hover:bg-[#20BE5B] text-white shadow-sm border-none" asChild>
                                                    <a
                                                        href={`https://wa.me/91${policy.mobile_no?.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Hi ${policy.customer_name}, your ${policy.product} policy is expiring on ${formatDate(policy.end_date)}. Please contact us for renewal.`)}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                    >
                                                        <MessageSquare className="w-4 h-4 sm:mr-2" />
                                                        <span className="hidden sm:inline">WhatsApp</span>
                                                    </a>
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
