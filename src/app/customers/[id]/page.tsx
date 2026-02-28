"use client";

import { use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Download, MoreVertical, Loader2, Upload, MapPin } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCustomer } from "@/lib/hooks/use-customers";
import { usePolicies } from "@/lib/hooks/use-policies";
import { useDocuments } from "@/lib/hooks/use-documents";

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number | null | undefined): string {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
}

export default function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: customer, isLoading: customerLoading } = useCustomer(id);
    const { data: policies, isLoading: policiesLoading } = usePolicies(undefined, id);
    const { data: documents, isLoading: docsLoading } = useDocuments(id);

    if (customerLoading) {
        return (
            <div className="flex items-center justify-center py-32 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading customer...
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="p-4 md:p-6 max-w-[1280px] mx-auto text-center py-20">
                <p className="text-slate-500">Client not found.</p>
                <Button asChild variant="ghost" className="mt-4"><Link href="/customers">← Back to Clients</Link></Button>
            </div>
        );
    }

    const initials = customer.customer_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const statusLabel = customer.status === "active" ? "Active" : customer.status === "prospect" ? "Lead" : customer.status === "churned" ? "Churned" : "Inactive";

    return (
        <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="flex flex-col items-start gap-4">
                    <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-900 -ml-2 h-8 px-2">
                        <Link href="/customers">
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Clients
                        </Link>
                    </Button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-white font-bold text-2xl md:text-3xl">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                                {customer.customer_name}
                                <Badge variant="secondary" className={`text-xs hidden sm:inline-flex ${statusLabel === "Active" ? "bg-emerald-50 text-emerald-700" : ""}`}>{statusLabel}</Badge>
                            </h1>
                            <p className="text-sm md:text-base text-slate-500 mt-1">Joined {formatDate(customer.created_at)}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2 md:mt-0 self-start md:self-auto w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none border-slate-200 text-slate-700 bg-white">
                        <Edit className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Edit</span>
                    </Button>
                    {customer.mobile_no && (
                        <Button className="flex-1 md:flex-none bg-[#25D366] hover:bg-[#20BE5B] text-white" asChild>
                            <a href={`https://wa.me/91${customer.mobile_no?.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noopener noreferrer">
                                <Phone className="w-4 h-4 mr-2" /> WhatsApp
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Details */}
                <div className="space-y-6">
                    <Card className="rounded-xl border-slate-200 shadow-sm border-t-4 border-t-indigo-500">
                        <CardHeader className="pb-3 border-b border-slate-100 mb-3 bg-slate-50/50">
                            <CardTitle className="text-base text-slate-900">Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs mb-0.5">Primary Phone</div>
                                    <div className="font-medium text-slate-900">{customer.mobile_no || "—"}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-slate-500 text-xs mb-0.5">Email Address</div>
                                    <div className="font-medium text-slate-900 truncate max-w-[200px]">{customer.email || "—"}</div>
                                </div>
                            </div>
                            {customer.date_of_birth && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-0.5">Date of Birth</div>
                                        <div className="font-medium text-slate-900">{formatDate(customer.date_of_birth)}</div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {customer.address && (
                        <Card className="rounded-xl border-slate-200 shadow-sm">
                            <CardHeader className="pb-3 border-b border-slate-100 mb-3 bg-slate-50/50">
                                <CardTitle className="text-base text-slate-900">Address</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-3 text-sm">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                    <div className="text-slate-700 leading-relaxed">{customer.address}</div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Policies & Docs */}
                <div className="lg:col-span-2">

                    <Tabs defaultValue="policies" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 mb-6 space-x-6">
                            <TabsTrigger value="policies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-slate-500 data-[state=active]:text-indigo-600 pb-3 pt-2 px-1">
                                Policies ({policies?.length ?? 0})
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-slate-500 data-[state=active]:text-indigo-600 pb-3 pt-2 px-1">
                                Documents ({documents?.length ?? 0})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="policies" className="space-y-4 outline-none">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-lg">Policies</h3>
                                <Button variant="outline" size="sm" asChild className="text-indigo-600 bg-indigo-50 border-transparent hover:bg-indigo-100 hover:text-indigo-700">
                                    <Link href={`/policies/new?customer=${id}`}>+ Add Policy</Link>
                                </Button>
                            </div>

                            {policiesLoading ? (
                                <div className="flex items-center justify-center py-12 text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading policies...
                                </div>
                            ) : !policies?.length ? (
                                <div className="text-center py-12 text-slate-500 border border-dashed rounded-xl border-slate-200 bg-slate-50">
                                    <p>No policies yet for this customer.</p>
                                    <Button variant="outline" className="mt-4" asChild>
                                        <Link href={`/policies/new?customer=${id}`}>+ Add First Policy</Link>
                                    </Button>
                                </div>
                            ) : (
                                policies.map(policy => (
                                    <Card key={policy.id} className="rounded-xl border-slate-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                        <span className="font-bold text-indigo-700 text-xs">{policy.company_name?.split(" ")[0]?.slice(0, 4)}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-base text-slate-900">{policy.product} {policy.policy_type && `· ${policy.policy_type}`}</h4>
                                                        <p className="text-sm text-slate-500 mt-0.5">{policy.company_name} · {policy.policy_no || "No policy #"}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className={`${policy.status === "active" ? "bg-emerald-50 text-emerald-700" : policy.status === "expired" ? "bg-red-50 text-red-700" : ""}`}>
                                                    {policy.status}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100 text-sm">
                                                <div>
                                                    <div className="text-slate-500 text-xs mb-1">Premium</div>
                                                    <div className="font-semibold text-slate-900">{formatCurrency(policy.premium_amount || policy.net_od_premium)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs mb-1">Start Date</div>
                                                    <div className="font-medium text-slate-900">{formatDate(policy.start_date)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs mb-1">Expiry Date</div>
                                                    <div className="font-medium text-slate-900">{formatDate(policy.end_date)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500 text-xs mb-1">Commission</div>
                                                    <div className="font-semibold text-emerald-700">{formatCurrency(policy.commission)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="documents" className="outline-none">
                            {docsLoading ? (
                                <div className="flex items-center justify-center py-12 text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading documents...
                                </div>
                            ) : !documents?.length ? (
                                <div className="text-center py-12 text-slate-500 border border-dashed rounded-xl border-slate-200 bg-slate-50">
                                    <p>No documents uploaded yet.</p>
                                    <Button variant="outline" className="mt-4">
                                        <Upload className="w-4 h-4 mr-2" /> Upload Document
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map(doc => (
                                        <div key={doc.id} className="bg-white border rounded-xl p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">📄</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-900 truncate">{doc.document_name}</div>
                                                <div className="text-xs text-slate-500">{doc.document_type} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ""}</div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-slate-400"><Download className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </div>
    );
}
