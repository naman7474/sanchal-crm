"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Trash2, UploadCloud, FileText, FileImage, X } from "lucide-react";
import Link from "next/link";
import { useCreateCustomer } from "@/lib/hooks/use-customers";
import { useCreatePolicy } from "@/lib/hooks/use-policies";
import { useUploadDocument } from "@/lib/hooks/use-documents";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import type { InsuranceCompany, ProductType } from "@/lib/types/database";

const supabase = createClient();

function useInsuranceCompanies() {
    return useQuery({
        queryKey: ["insurance-companies"],
        queryFn: async () => {
            const { data, error } = await supabase.from("insurance_companies").select("*").eq("is_active", true).order("name");
            if (error) throw error;
            return data as InsuranceCompany[];
        },
    });
}

function useProductTypes() {
    return useQuery({
        queryKey: ["product-types"],
        queryFn: async () => {
            const { data, error } = await supabase.from("product_types").select("*").eq("is_active", true).order("name");
            if (error) throw error;
            return data as ProductType[];
        },
    });
}

type InlinePolicy = {
    key: number;
    company_name: string;
    product: string;
    policy_type: string;
    policy_no: string;
    vehicle_no: string;
    start_date: string;
    end_date: string;
    net_od_premium: number;
    premium_amount: number;
    commission_percent: number;
};

type PendingDoc = { file: File; type: string };

const emptyPolicy = (): InlinePolicy => ({
    key: Date.now(),
    company_name: "",
    product: "",
    policy_type: "",
    policy_no: "",
    vehicle_no: "",
    start_date: "",
    end_date: "",
    net_od_premium: 0,
    premium_amount: 0,
    commission_percent: 0,
});

const selectClass = "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function NewCustomerPage() {
    const router = useRouter();
    const createCustomer = useCreateCustomer();
    const createPolicy = useCreatePolicy();
    const uploadDocument = useUploadDocument();
    const { data: companies } = useInsuranceCompanies();
    const { data: productTypes } = useProductTypes();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSaving, setIsSaving] = useState(false);

    // Customer form
    const [form, setForm] = useState({
        customer_name: "",
        mobile_no: "",
        email: "",
        address: "",
        date_of_birth: "",
        id_type: "",
        id_number: "",
        status: "active" as const,
        source: "",
        reference_name: "",
        notes: "",
    });

    // Inline policies
    const [policies, setPolicies] = useState<InlinePolicy[]>([]);

    // Pending documents
    const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);

    function updateField(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    function updatePolicy(key: number, field: string, value: string | number) {
        setPolicies(prev => prev.map(p => p.key === key ? { ...p, [field]: value } : p));
    }

    function addPolicy() {
        setPolicies(prev => [...prev, emptyPolicy()]);
    }

    function removePolicy(key: number) {
        setPolicies(prev => prev.filter(p => p.key !== key));
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        const newDocs: PendingDoc[] = files.map(file => ({
            file,
            type: file.type.startsWith("image/") ? "id_proof" : "policy_copy",
        }));
        setPendingDocs(prev => [...prev, ...newDocs]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function removeDoc(idx: number) {
        setPendingDocs(prev => prev.filter((_, i) => i !== idx));
    }

    function updateDocType(idx: number, type: string) {
        setPendingDocs(prev => prev.map((d, i) => i === idx ? { ...d, type } : d));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);

        try {
            // 1. Create customer
            const customer = await createCustomer.mutateAsync({
                ...form,
                date_of_birth: form.date_of_birth || null,
            });

            // 2. Create policies (in parallel)
            const validPolicies = policies.filter(p => p.company_name && p.product && p.start_date && p.end_date);
            if (validPolicies.length > 0) {
                await Promise.all(validPolicies.map(p =>
                    createPolicy.mutateAsync({
                        customer_id: customer.id,
                        company_name: p.company_name,
                        product: p.product,
                        policy_type: p.policy_type || null,
                        policy_no: p.policy_no || null,
                        vehicle_no: p.vehicle_no || null,
                        start_date: p.start_date,
                        end_date: p.end_date,
                        entry_date: new Date().toISOString().split("T")[0],
                        net_od_premium: p.net_od_premium,
                        premium_amount: p.premium_amount || null,
                        commission_percent: p.commission_percent,
                        sub_commission_percent: 0,
                        agent_name: null,
                        reference: null,
                        notes: null,
                        status: "active",
                        before_tds: 0,
                        tds_amount: 0,
                        commission: 0,
                        sub_before_tds: 0,
                        sub_tds_amount: 0,
                        sub_commission: 0,
                        profit: 0,
                        sum_insured: null,
                        renewal_of: null,
                    })
                ));
            }

            // 3. Upload documents (sequentially to avoid race conditions)
            for (const doc of pendingDocs) {
                await uploadDocument.mutateAsync({
                    file: doc.file,
                    customerId: customer.id,
                    documentType: doc.type,
                });
            }

            const parts = [];
            parts.push("Client created");
            if (validPolicies.length > 0) parts.push(`${validPolicies.length} ${validPolicies.length === 1 ? "policy" : "policies"} added`);
            if (pendingDocs.length > 0) parts.push(`${pendingDocs.length} ${pendingDocs.length === 1 ? "document" : "documents"} uploaded`);
            toast.success(parts.join(", ") + "!");

            router.push(`/customers/${customer.id}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="p-4 md:p-6 max-w-[900px] mx-auto w-full">
            <div className="mb-6 flex flex-col items-start gap-4">
                <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-900 -ml-2 h-8 px-2">
                    <Link href="/customers">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Clients
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Client</h1>
                    <p className="text-sm text-slate-500 mt-1">Create a client record with policies and documents</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>

                {/* ── SECTION 1: Customer Details ── */}
                <Card className="rounded-xl border-slate-200 shadow-sm mb-6 border-t-4 border-t-indigo-500">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg">Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-4">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Client Name <span className="text-red-500">*</span></label>
                            <Input value={form.customer_name} onChange={e => updateField("customer_name", e.target.value)} placeholder="e.g. Dharmender Singh" required className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Mobile Number <span className="text-red-500">*</span></label>
                            <Input value={form.mobile_no} onChange={e => updateField("mobile_no", e.target.value)} placeholder="+91 98999-25956" required type="tel" className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <Input value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="optional" type="email" className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                            <Input value={form.date_of_birth} onChange={e => updateField("date_of_birth", e.target.value)} type="date" className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">ID Type</label>
                            <select value={form.id_type} onChange={e => updateField("id_type", e.target.value)} className={selectClass}>
                                <option value="">Select...</option>
                                <option value="Aadhaar">Aadhaar</option>
                                <option value="PAN">PAN Card</option>
                                <option value="DL">Driving License</option>
                                <option value="Passport">Passport</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">ID Number</label>
                            <Input value={form.id_number} onChange={e => updateField("id_number", e.target.value)} placeholder="XXXX-XXXX-XXXX" className="h-11" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Source</label>
                            <select value={form.source} onChange={e => updateField("source", e.target.value)} className={selectClass}>
                                <option value="">Select...</option>
                                <option value="referral">Referral</option>
                                <option value="walk-in">Walk-in</option>
                                <option value="online">Online</option>
                                <option value="social_media">Social Media</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Referred By</label>
                            <Input value={form.reference_name} onChange={e => updateField("reference_name", e.target.value)} placeholder="Referrer name" className="h-11" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Address</label>
                            <Input value={form.address} onChange={e => updateField("address", e.target.value)} placeholder="Full address" className="h-11" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Notes</label>
                            <textarea value={form.notes} onChange={e => updateField("notes", e.target.value)} placeholder="Any additional notes..." className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y" />
                        </div>
                    </CardContent>
                </Card>

                {/* ── SECTION 2: Policies ── */}
                <Card className="rounded-xl border-slate-200 shadow-sm mb-6 border-t-4 border-t-emerald-500">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Policies</CardTitle>
                            <CardDescription className="mt-1">Add insurance policies for this customer</CardDescription>
                        </div>
                        <Button type="button" onClick={addPolicy} variant="outline" size="sm" className="text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 shrink-0">
                            <Plus className="w-4 h-4 mr-1.5" /> Add Policy
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {policies.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <p className="text-sm">No policies added yet</p>
                                <p className="text-xs mt-1">Click &quot;Add Policy&quot; above to attach one</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {policies.map((policy, idx) => {
                                    const pt = productTypes?.find(p => p.name === policy.product);
                                    const commission = (policy.net_od_premium * policy.commission_percent / 100) * 0.98; // after 2% TDS
                                    return (
                                        <div key={policy.key} className="relative bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-200 transition-colors">
                                            <div className="flex items-center justify-between mb-4">
                                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs font-semibold">
                                                    Policy #{idx + 1}
                                                </Badge>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => removePolicy(policy.key)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-500">Company <span className="text-red-400">*</span></label>
                                                    <select value={policy.company_name} onChange={e => updatePolicy(policy.key, "company_name", e.target.value)} className={selectClass} required>
                                                        <option value="">Select...</option>
                                                        {companies?.map(c => <option key={c.id} value={c.name}>{c.short_name || c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-500">Product <span className="text-red-400">*</span></label>
                                                    <select value={policy.product} onChange={e => updatePolicy(policy.key, "product", e.target.value)} className={selectClass} required>
                                                        <option value="">Select...</option>
                                                        {productTypes?.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-500">Policy Type</label>
                                                    <select value={policy.policy_type} onChange={e => updatePolicy(policy.key, "policy_type", e.target.value)} className={selectClass}>
                                                        <option value="">Select...</option>
                                                        <option value="comprehensive">Comprehensive</option>
                                                        <option value="third_party">Third Party</option>
                                                        <option value="standalone_od">Standalone OD</option>
                                                        <option value="individual">Individual</option>
                                                        <option value="floater">Family Floater</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-500">Policy Number</label>
                                                    <Input value={policy.policy_no} onChange={e => updatePolicy(policy.key, "policy_no", e.target.value)} placeholder="POL-123456" className="h-11" />
                                                </div>
                                                {pt?.requires_vehicle && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-slate-500">Vehicle No.</label>
                                                        <Input value={policy.vehicle_no} onChange={e => updatePolicy(policy.key, "vehicle_no", e.target.value.toUpperCase())} placeholder="DL01AB1234" className="h-11 uppercase" />
                                                    </div>
                                                )}
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-500">Start Date <span className="text-red-400">*</span></label>
                                                    <Input type="date" value={policy.start_date} onChange={e => updatePolicy(policy.key, "start_date", e.target.value)} className="h-11" required />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-500">End Date <span className="text-red-400">*</span></label>
                                                    <Input type="date" value={policy.end_date} onChange={e => updatePolicy(policy.key, "end_date", e.target.value)} className="h-11" required />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-500">Net OD Premium (₹)</label>
                                                    <Input type="number" value={policy.net_od_premium || ""} onChange={e => updatePolicy(policy.key, "net_od_premium", parseFloat(e.target.value) || 0)} placeholder="0" className="h-11" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-slate-500">Commission %</label>
                                                    <Input type="number" value={policy.commission_percent || ""} onChange={e => updatePolicy(policy.key, "commission_percent", parseFloat(e.target.value) || 0)} step="0.5" placeholder="10" className="h-11" />
                                                </div>
                                            </div>

                                            {policy.net_od_premium > 0 && policy.commission_percent > 0 && (
                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-sm">
                                                    <span className="text-slate-500">Net Commission:</span>
                                                    <span className="font-bold text-emerald-700">₹{commission.toFixed(2)}</span>
                                                    <span className="text-slate-400 text-xs">(after 2% TDS)</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <Button type="button" onClick={addPolicy} variant="ghost" className="w-full border border-dashed border-slate-200 text-slate-500 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50/50 h-11">
                                    <Plus className="w-4 h-4 mr-2" /> Add Another Policy
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── SECTION 3: Documents ── */}
                <Card className="rounded-xl border-slate-200 shadow-sm mb-6 border-t-4 border-t-amber-500">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Documents</CardTitle>
                            <CardDescription className="mt-1">Upload Aadhaar, PAN, policy copies, etc.</CardDescription>
                        </div>
                        <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" size="sm" className="text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 shrink-0">
                            <UploadCloud className="w-4 h-4 mr-1.5" /> Upload
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            onChange={handleFileSelect}
                        />

                        {pendingDocs.length === 0 ? (
                            <div
                                className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer hover:bg-amber-50/30 hover:border-amber-200 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm">Click to select files</p>
                                <p className="text-xs mt-1">PDF, JPG, PNG, DOCX up to 10MB each</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingDocs.map((doc, idx) => {
                                    const isImage = doc.file.type.startsWith("image/");
                                    const sizeMB = doc.file.size / (1024 * 1024);
                                    return (
                                        <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-amber-200 transition-colors">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isImage ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
                                                {isImage ? <FileImage className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">{doc.file.name}</p>
                                                <p className="text-xs text-slate-400">{sizeMB.toFixed(1)} MB</p>
                                            </div>
                                            <select value={doc.type} onChange={e => updateDocType(idx, e.target.value)} className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-600 focus:ring-1 focus:ring-amber-500 focus:outline-none">
                                                <option value="policy_copy">Policy Copy</option>
                                                <option value="id_proof">ID Proof</option>
                                                <option value="claim_form">Claim Form</option>
                                                <option value="rc_copy">RC Copy</option>
                                                <option value="photo">Photo</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => removeDoc(idx)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}

                                <Button type="button" onClick={() => fileInputRef.current?.click()} variant="ghost" className="w-full border border-dashed border-slate-200 text-slate-500 hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50/50 h-10 text-sm">
                                    <Plus className="w-4 h-4 mr-2" /> Add More Documents
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Submit ── */}
                <div className="flex gap-3 mb-8">
                    <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 shadow-sm">
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isSaving ? "Saving everything..." : "Save Client"}
                    </Button>
                    <Button type="button" variant="secondary" className="h-11" asChild>
                        <Link href="/customers">Cancel</Link>
                    </Button>
                    {(policies.length > 0 || pendingDocs.length > 0) && (
                        <div className="flex items-center gap-2 ml-auto text-sm text-slate-500">
                            {policies.length > 0 && <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">{policies.length} {policies.length === 1 ? "policy" : "policies"}</Badge>}
                            {pendingDocs.length > 0 && <Badge variant="secondary" className="bg-amber-50 text-amber-700">{pendingDocs.length} {pendingDocs.length === 1 ? "doc" : "docs"}</Badge>}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
