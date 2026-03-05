"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, UploadCloud, Loader2, X, FileText } from "lucide-react";
import { useCreatePolicy } from "@/lib/hooks/use-policies";
import { useCustomers } from "@/lib/hooks/use-customers";
import { useUploadDocument } from "@/lib/hooks/use-documents";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { InsuranceCompany, ProductType } from "@/lib/types/database";
import { useQuery } from "@tanstack/react-query";

const supabase = createClient();

function useInsuranceCompanies() {
    return useQuery({
        queryKey: ["insurance-companies"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("insurance_companies")
                .select("*")
                .eq("is_active", true)
                .order("name");
            if (error) throw error;
            return data as InsuranceCompany[];
        },
    });
}

function useProductTypes() {
    return useQuery({
        queryKey: ["product-types"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("product_types")
                .select("*")
                .eq("is_active", true)
                .order("name");
            if (error) throw error;
            return data as ProductType[];
        },
    });
}

export function PolicyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedCustomer = searchParams.get("customer") || "";

    const createPolicy = useCreatePolicy();
    const uploadDocument = useUploadDocument();
    const { data: customers } = useCustomers();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const { data: companies } = useInsuranceCompanies();
    const { data: productTypes } = useProductTypes();

    const [form, setForm] = useState({
        customer_id: preselectedCustomer,
        company_name: "",
        product: "",
        policy_type: "",
        sub_product: "",
        policy_no: "",
        vehicle_no: "",
        start_date: "",
        end_date: "",
        net_od_premium: 0,
        premium_amount: 0,
        commission_percent: 0,
        sub_commission_percent: 0,
        agent_name: "",
        reference: "",
        notes: "",
        status: "active" as const,
    });

    function updateField(field: string, value: string | number) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    // Auto-calculate commission fields
    const calculations = useMemo(() => {
        const netOd = form.net_od_premium || 0;
        const commPct = form.commission_percent || 0;
        const subCommPct = form.sub_commission_percent || 0;

        const beforeTds = netOd * (commPct / 100);
        const tds = beforeTds * 0.02;
        const commission = beforeTds - tds;

        const subBeforeTds = netOd * (subCommPct / 100);
        const subTds = subBeforeTds * 0.02;
        const subCommission = subBeforeTds - subTds;

        const profit = commission - subCommission;

        return { beforeTds, tds, commission, subBeforeTds, subTds, subCommission, profit };
    }, [form.net_od_premium, form.commission_percent, form.sub_commission_percent]);

    // Set company default commission on company change
    useEffect(() => {
        if (form.company_name && companies) {
            const company = companies.find(c => c.name === form.company_name);
            if (company?.default_commission_percent) {
                updateField("commission_percent", company.default_commission_percent);
            }
        }
    }, [form.company_name, companies]);

    // Product type selection: set product and check if vehicle is required
    const selectedProductType = productTypes?.find(p => p.name === form.product);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.customer_id) {
            toast.error("Please select a customer");
            return;
        }

        try {
            const policy = await createPolicy.mutateAsync({
                customer_id: form.customer_id,
                company_name: form.company_name,
                product: form.product,
                policy_type: form.policy_type || null,
                policy_no: form.policy_no || null,
                vehicle_no: form.vehicle_no || null,
                start_date: form.start_date,
                end_date: form.end_date,
                entry_date: new Date().toISOString().split("T")[0],
                net_od_premium: form.net_od_premium,
                premium_amount: form.premium_amount || null,
                commission_percent: form.commission_percent,
                sub_commission_percent: form.sub_commission_percent,
                agent_name: form.agent_name || null,
                reference: form.reference || null,
                notes: form.notes || null,
                status: form.status,
                before_tds: 0,
                tds_amount: 0,
                commission: 0,
                sub_before_tds: 0,
                sub_tds_amount: 0,
                sub_commission: 0,
                profit: 0,
                sum_insured: null,
                renewal_of: null,
            });

            // Upload attached files
            for (const file of selectedFiles) {
                try {
                    await uploadDocument.mutateAsync({
                        file,
                        customerId: form.customer_id,
                        policyId: policy.id,
                        documentType: "policy_copy",
                    });
                } catch {
                    toast.error(`Failed to upload ${file.name}`);
                }
            }

            toast.success("Policy saved successfully!");
            router.push("/policies");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to save policy";
            toast.error(message);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Main Form Area */}
                <div className="md:col-span-2 space-y-4">

                    {/* Customer Selection */}
                    <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden border-t-4 border-t-indigo-500">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                            <CardTitle className="text-base">Client</CardTitle>
                            <CardDescription className="text-xs">Select the client for this policy</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 pb-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Customer <span className="text-red-500">*</span></label>
                                <select
                                    value={form.customer_id}
                                    onChange={e => updateField("customer_id", e.target.value)}
                                    required
                                    className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="">Select Customer</option>
                                    {customers?.map(c => (
                                        <option key={c.id} value={c.id}>{c.customer_name} {c.mobile_no ? `(${c.mobile_no})` : ""}</option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                            <CardTitle className="text-base">Policy Details</CardTitle>
                            <CardDescription className="text-xs">Core details of the insurance policy</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4">

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Insurance Company <span className="text-red-500">*</span></label>
                                <select value={form.company_name} onChange={e => updateField("company_name", e.target.value)} required className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                    <option value="">Select Company</option>
                                    {companies?.map(c => (
                                        <option key={c.id} value={c.name}>{c.short_name || c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Product Type <span className="text-red-500">*</span></label>
                                <select value={form.product} onChange={e => updateField("product", e.target.value)} required className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                    <option value="">Select Product</option>
                                    {productTypes?.map(p => (
                                        <option key={p.id} value={p.name}>{p.name} ({p.category})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Policy Type</label>
                                <select value={form.policy_type} onChange={e => updateField("policy_type", e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                    <option value="">Select...</option>
                                    <option value="comprehensive">Comprehensive / Package</option>
                                    <option value="third_party">Third Party (TP)</option>
                                    <option value="standalone_od">Standalone OD</option>
                                    <option value="individual">Individual</option>
                                    <option value="floater">Family Floater</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Policy Number</label>
                                <div className="relative">
                                    <Input value={form.policy_no} onChange={e => updateField("policy_no", e.target.value)} placeholder="POL-123456789" className="h-11 pr-10" />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1.5 h-8 w-8 text-slate-400" onClick={() => { navigator.clipboard.writeText(form.policy_no); toast.success("Copied!"); }}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {selectedProductType?.requires_vehicle && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Vehicle Number</label>
                                    <Input value={form.vehicle_no} onChange={e => updateField("vehicle_no", e.target.value.toUpperCase())} placeholder="DL01AB1234" className="h-11 uppercase" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Start Date <span className="text-red-500">*</span></label>
                                <Input type="date" value={form.start_date} onChange={e => updateField("start_date", e.target.value)} required className="h-11" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">End Date <span className="text-red-500">*</span></label>
                                <Input type="date" value={form.end_date} onChange={e => updateField("end_date", e.target.value)} required className="h-11" />
                            </div>

                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
                            <CardTitle className="text-base">Financials</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 pb-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Net OD Premium (₹) <span className="text-red-500">*</span></label>
                                    <Input type="number" value={form.net_od_premium || ""} onChange={e => updateField("net_od_premium", parseFloat(e.target.value) || 0)} placeholder="0.00" required className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Total Premium (₹)</label>
                                    <Input type="number" value={form.premium_amount || ""} onChange={e => updateField("premium_amount", parseFloat(e.target.value) || 0)} placeholder="0.00" className="h-11 bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Commission Rate (%)</label>
                                    <Input type="number" value={form.commission_percent || ""} onChange={e => updateField("commission_percent", parseFloat(e.target.value) || 0)} step="0.5" placeholder="10" className="h-11" />
                                </div>
                            </div>

                            {/* Auto-calculated summary */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Commission Breakdown</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Before TDS</div>
                                        <div className="font-semibold text-slate-900">₹{calculations.beforeTds.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">TDS (2%)</div>
                                        <div className="font-semibold text-red-600">-₹{calculations.tds.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Net Commission</div>
                                        <div className="font-semibold text-emerald-700">₹{calculations.commission.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Your Profit</div>
                                        <div className="font-bold text-indigo-700 text-base">₹{calculations.profit.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Sub-Commission %</label>
                                    <Input type="number" value={form.sub_commission_percent || ""} onChange={e => updateField("sub_commission_percent", parseFloat(e.target.value) || 0)} step="0.5" placeholder="0" className="h-11" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Agent / Sub-Agent</label>
                                    <Input value={form.agent_name} onChange={e => updateField("agent_name", e.target.value)} placeholder="Agent name" className="h-11" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Reference / Referrer</label>
                                <Input value={form.reference} onChange={e => updateField("reference", e.target.value)} placeholder="e.g. Rohit BKB, Shyam Car Bazar" className="h-11" />
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar Area */}
                <div className="space-y-6">

                    <Card className="rounded-xl border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Documents</CardTitle>
                            <CardDescription className="text-xs">Attach policy PDFs or images</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setSelectedFiles(prev => [...prev, ...files]);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                            />
                            <div
                                className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-indigo-50/30 hover:border-indigo-200 transition-colors cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="w-6 h-6 text-indigo-500 mb-1.5" />
                                <p className="text-sm font-medium text-slate-700">Click to select files</p>
                                <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
                            </div>
                            {selectedFiles.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {selectedFiles.map((file, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm">
                                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="truncate flex-1 text-slate-700">{file.name}</span>
                                            <button type="button" onClick={() => setSelectedFiles(prev => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-slate-200 shadow-sm bg-indigo-50/50">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-slate-700">Status</span>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>
                            </div>
                            <Button type="submit" disabled={createPolicy.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base shadow-sm">
                                {createPolicy.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {createPolicy.isPending ? "Saving..." : "Save Policy"}
                            </Button>
                            <Button type="button" variant="ghost" className="w-full mt-2 text-slate-500 hover:text-slate-900 h-11" onClick={() => router.push("/policies")}>
                                Cancel
                            </Button>
                        </CardContent>
                    </Card>

                </div>

            </div>
        </form>
    );
}
