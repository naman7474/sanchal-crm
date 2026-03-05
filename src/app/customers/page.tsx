"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCustomers } from "@/lib/hooks/use-customers";
import { QuickCreateCustomer } from "@/components/customers/QuickCreateCustomer";
import Link from "next/link";

const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "prospect", label: "Lead" },
    { value: "inactive", label: "Inactive" },
    { value: "churned", label: "Churned" },
];

const SOURCE_OPTIONS = [
    { value: "", label: "All Sources" },
    { value: "referral", label: "Referral" },
    { value: "walk-in", label: "Walk-in" },
    { value: "online", label: "Online" },
    { value: "social_media", label: "Social Media" },
];

const selectClass = "h-10 text-base md:text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat pr-7";

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: customers, isLoading } = useCustomers(searchQuery || undefined);
    const [statusFilter, setStatusFilter] = useState("");
    const [sourceFilter, setSourceFilter] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    const filtered = useMemo(() => {
        if (!customers) return [];
        let list = customers;
        if (statusFilter) list = list.filter(c => c.status === statusFilter);
        if (sourceFilter) list = list.filter(c => c.source === sourceFilter);
        return list;
    }, [customers, statusFilter, sourceFilter]);

    const hasFilters = statusFilter || sourceFilter;

    return (
        <div className="p-3 md:p-6 max-w-[1280px] mx-auto w-full pb-24 md:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Clients</h1>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5">Manage your clients and their portfolios</p>
                </div>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 md:h-11 text-sm px-3 md:px-4 shrink-0"
                    onClick={() => setShowCreate(true)}
                >
                    <Plus className="w-4 h-4 mr-1.5" /> Add Client
                </Button>
            </div>

            {/* Search + Filters — compact */}
            <div className="flex flex-col gap-2 mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search by name or phone..."
                        className="pl-9 bg-white border-slate-200 h-10 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={cn(selectClass, "flex-1 md:flex-none md:w-auto min-w-0")}>
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className={cn(selectClass, "flex-1 md:flex-none md:w-auto min-w-0")}>
                        {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {hasFilters && (
                        <button onClick={() => { setStatusFilter(""); setSourceFilter(""); }} className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{filtered.length} {filtered.length === 1 ? "client" : "clients"}</span>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                </div>
            ) : !filtered.length ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-3xl mb-2">👥</p>
                    <p className="text-slate-900 font-semibold mb-1">{hasFilters ? "No matching clients" : "No clients yet"}</p>
                    <p className="text-sm text-slate-500 mb-3">{hasFilters ? "Try adjusting your filters" : "Add your first client to get started"}</p>
                    {!hasFilters && (
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm" onClick={() => setShowCreate(true)}>
                            <Plus className="w-4 h-4 mr-1.5" /> Add Client
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    {/* Mobile: Compact List */}
                    <div className="md:hidden space-y-2">
                        {filtered.map(customer => {
                            const policyCount = customer.policies?.[0]?.count ?? 0;
                            const statusLabel = customer.status === "active" ? "Active" : customer.status === "prospect" ? "Lead" : customer.status === "churned" ? "Churned" : "Inactive";
                            return (
                                <Link key={customer.id} href={`/customers/${customer.id}`} className="block">
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 active:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                                                {customer.customer_name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="font-semibold text-sm text-slate-900 truncate">{customer.customer_name}</h3>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "text-[10px] px-1.5 py-0 h-5 shrink-0",
                                                            statusLabel === "Active" ? "bg-emerald-50 text-emerald-700" : statusLabel === "Churned" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                                                        )}
                                                    >
                                                        {statusLabel}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                                                    <span>{customer.mobile_no || "No phone"}</span>
                                                    <span>•</span>
                                                    <span>{policyCount} {policyCount === 1 ? "policy" : "policies"}</span>
                                                    {customer.source && <><span>•</span><span className="capitalize">{customer.source}</span></>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop: Table */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[13px] uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-xl">Client</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Policies</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((customer) => {
                                    const policyCount = customer.policies?.[0]?.count ?? 0;
                                    const statusLabel = customer.status === "active" ? "Active" : customer.status === "prospect" ? "Lead" : customer.status === "churned" ? "Churned" : "Inactive";
                                    return (
                                        <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                        {customer.customer_name.charAt(0)}
                                                    </div>
                                                    <div className="font-semibold text-slate-900">{customer.customer_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">{customer.mobile_no || "—"}</td>
                                            <td className="px-6 py-4 font-medium">{policyCount}</td>
                                            <td className="px-6 py-4 text-slate-500 capitalize">{customer.source || "—"}</td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={statusLabel === "Active" ? "secondary" : statusLabel === "Churned" ? "destructive" : "outline"}
                                                    className={cn(
                                                        statusLabel === "Active" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : ""
                                                    )}
                                                >
                                                    {statusLabel}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" asChild>
                                                    <Link href={`/customers/${customer.id}`}>View</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <QuickCreateCustomer open={showCreate} onOpenChange={setShowCreate} />
        </div>
    );
}
