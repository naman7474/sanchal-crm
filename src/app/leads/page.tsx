"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, Phone, Store, MoreVertical, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLeads, useCreateLead } from "@/lib/hooks/use-leads";
import { toast } from "sonner";

function statusVariant(status: string): "destructive" | "secondary" | "outline" {
    if (status === "new") return "destructive";
    if (status === "converted") return "secondary";
    return "outline";
}

function statusClassName(status: string): string {
    if (status === "converted") return "bg-emerald-50 text-emerald-700";
    if (status === "negotiating" || status === "quoted") return "bg-amber-50 text-amber-700 border-amber-200";
    return "";
}

export default function LeadsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: leads, isLoading } = useLeads(searchQuery || undefined);
    const createLead = useCreateLead();

    // Simple add lead (could be a dialog in future)
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLead, setNewLead] = useState({ name: "", phone: "", interested_product: "", source: "" });

    async function handleAddLead(e: React.FormEvent) {
        e.preventDefault();
        try {
            await createLead.mutateAsync({
                ...newLead,
                status: "new",
            });
            toast.success("Lead added!");
            setShowAddForm(false);
            setNewLead({ name: "", phone: "", interested_product: "", source: "" });
        } catch {
            toast.error("Failed to add lead");
        }
    }

    return (
        <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads & Prospects</h1>
                    <p className="text-sm text-slate-500 mt-1">Track potential customers and sales pipeline</p>
                </div>
                <Button onClick={() => setShowAddForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full md:w-auto h-11">
                    <Plus className="w-5 h-5 mr-2" /> Add Lead
                </Button>
            </div>

            {/* Quick Add Form */}
            {showAddForm && (
                <form onSubmit={handleAddLead} className="bg-white border border-indigo-200 rounded-xl p-5 mb-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <Input placeholder="Name *" required value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} className="h-11" />
                        <Input placeholder="Phone" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} className="h-11" />
                        <Input placeholder="Interested in..." value={newLead.interested_product} onChange={e => setNewLead(p => ({ ...p, interested_product: e.target.value }))} className="h-11" />
                        <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} className="h-11 rounded-md border border-input px-3 text-sm">
                            <option value="">Source</option>
                            <option value="referral">Referral</option>
                            <option value="walk-in">Walk-in</option>
                            <option value="website">Website</option>
                            <option value="social_media">Social Media</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={createLead.isPending} className="bg-indigo-600 hover:bg-indigo-700 h-10">
                            {createLead.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Lead
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} className="h-10">Cancel</Button>
                    </div>
                </form>
            )}

            {/* Toolbar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search leads by name or phone..."
                        className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-indigo-600 transition-colors h-11 text-[15px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-11 bg-white border-slate-200 text-slate-700 w-full md:w-auto">
                    <Filter className="w-4 h-4 mr-2" /> Filter By Status
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading leads...
                </div>
            ) : !leads?.length ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-4xl mb-3">🎯</p>
                    <p className="text-slate-900 font-semibold mb-1">No leads yet</p>
                    <p className="text-sm text-slate-500 mb-4">Start tracking potential customers</p>
                    <Button onClick={() => setShowAddForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add First Lead
                    </Button>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {leads.map(lead => (
                            <div key={lead.id} className="bg-white border text-card-foreground shadow-sm rounded-xl p-5 relative">
                                <div className="flex flex-col gap-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={statusVariant(lead.status)} className={cn("mb-1", statusClassName(lead.status))}>{lead.status}</Badge>
                                        <span className="text-xs text-slate-400 font-medium">{new Date(lead.created_at).toLocaleDateString("en-GB")}</span>
                                    </div>
                                    <h3 className="font-bold text-[18px] text-slate-900 pr-6">{lead.name}</h3>
                                    {lead.phone && (
                                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                                            <Phone className="w-4 h-4" /> {lead.phone}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-2 text-sm mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Interested In</span>
                                        <span className="font-medium text-slate-900">{lead.interested_product || "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Source</span>
                                        <span className="font-medium text-slate-900 flex items-center gap-1">
                                            <Store className="w-3.5 h-3.5" /> {lead.source || "—"}
                                        </span>
                                    </div>
                                </div>

                                {lead.phone && (
                                    <div className="flex gap-2">
                                        <Button className="flex-1 bg-[#25D366] hover:bg-[#20BE5B] text-white" asChild>
                                            <a href={`https://wa.me/91${lead.phone.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[13px] uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-xl">Lead Info</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Interest / Source</th>
                                    <th className="px-6 py-4">Added On</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-900 text-base">{lead.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {lead.phone && (
                                                <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{lead.interested_product || "—"}</div>
                                            {lead.source && (
                                                <div className="flex items-center gap-1 text-slate-500 text-xs mt-0.5">
                                                    <Store className="w-3 h-3" /> {lead.source}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {new Date(lead.created_at).toLocaleDateString("en-GB")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={statusVariant(lead.status)} className={cn(statusClassName(lead.status))}>{lead.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {lead.phone && (
                                                <Button size="sm" className="bg-[#25D366] hover:bg-[#20BE5B] text-white" asChild>
                                                    <a href={`https://wa.me/91${lead.phone.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noopener noreferrer">Contact</a>
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
