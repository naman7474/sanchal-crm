"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Download, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePolicies } from "@/lib/hooks/use-policies";

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number | null | undefined): string {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
}

function statusVariant(status: string): "secondary" | "destructive" | "outline" {
    if (status === "active") return "secondary";
    if (status === "expired" || status === "cancelled") return "destructive";
    return "outline";
}

const POLICY_TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    { value: "comprehensive", label: "Comprehensive" },
    { value: "third_party", label: "Third Party" },
    { value: "standalone_od", label: "Standalone OD" },
    { value: "individual", label: "Individual" },
    { value: "floater", label: "Family Floater" },
];

const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "cancelled", label: "Cancelled" },
];

const selectClass = "h-10 text-base md:text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7";

export default function PoliciesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: policies, isLoading } = usePolicies(searchQuery || undefined);
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Extract unique products from data for dynamic filter
    const productOptions = useMemo(() => {
        if (!policies) return [];
        const products = [...new Set(policies.map(p => p.product).filter(Boolean))];
        return products.sort();
    }, [policies]);

    const [productFilter, setProductFilter] = useState("");

    const filtered = useMemo(() => {
        if (!policies) return [];
        let list = policies;
        if (typeFilter) list = list.filter(p => p.policy_type === typeFilter);
        if (statusFilter) list = list.filter(p => p.status === statusFilter);
        if (productFilter) list = list.filter(p => p.product === productFilter);
        return list;
    }, [policies, typeFilter, statusFilter, productFilter]);

    const hasFilters = typeFilter || statusFilter || productFilter;

    return (
        <div className="p-3 md:p-6 max-w-[1280px] mx-auto w-full pb-24 md:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Policies</h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5">Manage all insurance policies</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 md:h-11 text-sm px-3 md:px-4 shrink-0">
                        <Link href="/policies/new">
                            <Plus className="w-4 h-4 mr-1.5" /> Add Policy
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col gap-2 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search by policy no, client or product..."
                        className="pl-9 bg-white border-slate-200 h-10 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={cn(selectClass, "flex-1 md:flex-none md:w-auto min-w-0")}>
                        {POLICY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={cn(selectClass, "flex-1 md:flex-none md:w-auto min-w-0")}>
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {productOptions.length > 0 && (
                        <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className={cn(selectClass, "flex-1 md:flex-none md:w-auto min-w-0")}>
                            <option value="">All Products</option>
                            {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    )}
                    {hasFilters && (
                        <button onClick={() => { setTypeFilter(""); setStatusFilter(""); setProductFilter(""); }} className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{filtered.length} {filtered.length === 1 ? "policy" : "policies"}</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                </div>
            ) : !filtered.length ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="text-slate-900 font-semibold mb-1">{hasFilters ? "No matching policies" : "No policies yet"}</p>
                    <p className="text-sm text-slate-500 mb-3">{hasFilters ? "Try adjusting your filters" : "Create your first policy record"}</p>
                    {!hasFilters && (
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm">
                            <Link href="/policies/new"><Plus className="w-4 h-4 mr-1.5" /> Add Policy</Link>
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    {/* Mobile: Compact Cards */}
                    <div className="md:hidden space-y-2">
                        {filtered.map(policy => (
                            <div key={policy.id} className="bg-white border border-slate-200 rounded-lg p-3">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm text-slate-900 truncate">{policy.product}</h3>
                                        <p className="text-xs text-slate-500 truncate">{policy.company_name} · {policy.policy_no || "—"}</p>
                                    </div>
                                    <Badge variant={statusVariant(policy.status)} className={cn(
                                        "text-[10px] px-1.5 py-0 h-5 shrink-0 capitalize",
                                        policy.status === "active" ? "bg-emerald-50 text-emerald-700" : ""
                                    )}>{policy.status}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-100">
                                    <span className="truncate">{policy.customer_name || "—"}</span>
                                    <span className="font-medium">{formatCurrency(policy.premium_amount || policy.net_od_premium)}</span>
                                    <span className="ml-auto text-slate-400">{formatDate(policy.end_date)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Table */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[13px] uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-xl">Policy Details</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Premium</th>
                                    <th className="px-6 py-4">Expiry Date</th>
                                    <th className="px-6 py-4 text-right rounded-tr-xl">Commission</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((policy) => (
                                    <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{policy.product}</div>
                                            <div className="text-slate-500 text-xs mt-0.5">{policy.company_name} · {policy.policy_no || "—"}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">{policy.customer_name || "—"}</td>
                                        <td className="px-6 py-4 text-slate-500 capitalize">{policy.policy_type || "—"}</td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusVariant(policy.status)} className={cn(
                                                policy.status === "active" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : ""
                                            )}>{policy.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{formatCurrency(policy.premium_amount || policy.net_od_premium)}</td>
                                        <td className="px-6 py-4 text-slate-700">{formatDate(policy.end_date)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-700">{formatCurrency(policy.commission)}</td>
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
