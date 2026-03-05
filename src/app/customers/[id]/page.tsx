"use client";

import { use, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Mail, Phone, Calendar, Download, Loader2, Upload, MapPin, User, FileText, Folder, X, FileImage, UploadCloud, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomer, useUpdateCustomer } from "@/lib/hooks/use-customers";
import { usePolicies } from "@/lib/hooks/use-policies";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/lib/hooks/use-documents";
import { toast } from "sonner";

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCurrency(amount: number | null | undefined): string {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
}

// ─── Profile Info Row ───
function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
            {icon && (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                    {icon}
                </div>
            )}
            <div className="min-w-0">
                <div className="text-xs text-slate-500 mb-0.5">{label}</div>
                <div className="text-sm font-medium text-slate-900 break-words">{value || "—"}</div>
            </div>
        </div>
    );
}

export default function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: customer, isLoading: customerLoading } = useCustomer(id);
    const { data: policies, isLoading: policiesLoading } = usePolicies(undefined, id);
    const { data: documents, isLoading: docsLoading } = useDocuments(id);
    const updateCustomer = useUpdateCustomer();
    const uploadDocument = useUploadDocument();
    const deleteDocument = useDeleteDocument();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editOpen, setEditOpen] = useState(false);
    const [formData, setFormData] = useState({
        customer_name: "",
        mobile_no: "",
        email: "",
        address: "",
        date_of_birth: "",
        id_type: "",
        id_number: "",
        status: "active" as "active" | "prospect" | "inactive" | "churned",
        source: "",
        reference_name: "",
        notes: "",
    });

    const openEditDialog = () => {
        if (customer) {
            setFormData({
                customer_name: customer.customer_name || "",
                mobile_no: customer.mobile_no || "",
                email: customer.email || "",
                address: customer.address || "",
                date_of_birth: customer.date_of_birth || "",
                id_type: customer.id_type || "",
                id_number: customer.id_number || "",
                status: customer.status,
                source: customer.source || "",
                reference_name: customer.reference_name || "",
                notes: customer.notes || "",
            });
            setEditOpen(true);
        }
    };

    const handleSave = async () => {
        await updateCustomer.mutateAsync({
            id,
            ...formData,
        });
        setEditOpen(false);
        toast.success("Client updated!");
    };

    // Document upload handler
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        for (const file of files) {
            try {
                await uploadDocument.mutateAsync({
                    file,
                    customerId: id,
                    documentType: file.type.startsWith("image/") ? "id_proof" : "policy_copy",
                });
                toast.success(`"${file.name}" uploaded`);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Upload failed";
                toast.error(message);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

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
        <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full pb-24 md:pb-6">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="flex flex-col items-start gap-4">
                    <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-900 -ml-2 h-8 px-2">
                        <Link href="/customers">
                            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Clients
                        </Link>
                    </Button>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-white font-bold text-xl md:text-2xl">
                            {initials}
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                                {customer.customer_name}
                                <Badge variant="secondary" className={`text-xs hidden sm:inline-flex ${statusLabel === "Active" ? "bg-emerald-50 text-emerald-700" : ""}`}>{statusLabel}</Badge>
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">{customer.mobile_no || "No phone"} {customer.email ? `· ${customer.email}` : ""}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2 md:mt-0 self-start md:self-auto">
                    <Button variant="outline" className="border-slate-200 text-slate-700 bg-white" onClick={openEditDialog}>
                        <Edit className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Edit</span>
                    </Button>
                    {customer.mobile_no && (
                        <Button className="bg-[#25D366] hover:bg-[#20BE5B] text-white" asChild>
                            <a href={`https://wa.me/91${customer.mobile_no?.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noopener noreferrer">
                                <Phone className="w-4 h-4 mr-2" /> WhatsApp
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Full-Width Tabs */}
            <Tabs defaultValue="policies" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 mb-6 space-x-4 md:space-x-6 overflow-x-auto">
                    <TabsTrigger value="policies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-slate-500 data-[state=active]:text-indigo-600 pb-3 pt-2 px-1 text-sm md:text-base">
                        <FileText className="w-4 h-4 mr-1.5 hidden md:inline-block" />
                        Policies ({policies?.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-slate-500 data-[state=active]:text-indigo-600 pb-3 pt-2 px-1 text-sm md:text-base">
                        <User className="w-4 h-4 mr-1.5 hidden md:inline-block" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-slate-500 data-[state=active]:text-indigo-600 pb-3 pt-2 px-1 text-sm md:text-base">
                        <Folder className="w-4 h-4 mr-1.5 hidden md:inline-block" />
                        Documents ({documents?.length ?? 0})
                    </TabsTrigger>
                </TabsList>

                {/* ─── POLICIES TAB ─── */}
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
                        policies.map((policy: any) => (
                            <Card key={policy.id} className="rounded-xl border-slate-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
                                <div className="p-4 md:p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                <span className="font-bold text-indigo-700 text-xs">{policy.company_name?.split(" ")[0]?.slice(0, 4)}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-sm md:text-base text-slate-900">{policy.product} {policy.policy_type && `· ${policy.policy_type}`}</h4>
                                                <p className="text-xs md:text-sm text-slate-500 mt-0.5">{policy.company_name} · {policy.policy_no || "No policy #"}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className={`text-xs ${policy.status === "active" ? "bg-emerald-50 text-emerald-700" : policy.status === "expired" ? "bg-red-50 text-red-700" : ""}`}>
                                            {policy.status}
                                        </Badge>
                                    </div>

                                    {/* Policy fields matching SAMPLE.xlsx */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-4 pt-3 border-t border-slate-100 text-sm">
                                        {policy.vehicle_no && (
                                            <div>
                                                <div className="text-slate-500 text-xs mb-0.5">Vehicle No.</div>
                                                <div className="font-medium text-slate-900 uppercase">{policy.vehicle_no}</div>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-slate-500 text-xs mb-0.5">Start Date</div>
                                            <div className="font-medium text-slate-900">{formatDate(policy.start_date)}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs mb-0.5">End Date</div>
                                            <div className="font-medium text-slate-900">{formatDate(policy.end_date)}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs mb-0.5">Net / OD Premium</div>
                                            <div className="font-semibold text-slate-900">{formatCurrency(policy.net_od_premium)}</div>
                                        </div>
                                        {policy.agent_name && (
                                            <div>
                                                <div className="text-slate-500 text-xs mb-0.5">Agent</div>
                                                <div className="font-medium text-slate-900">{policy.agent_name}</div>
                                            </div>
                                        )}
                                        {policy.reference && (
                                            <div>
                                                <div className="text-slate-500 text-xs mb-0.5">Reference</div>
                                                <div className="font-medium text-slate-900">{policy.reference}</div>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-slate-500 text-xs mb-0.5">Commission %</div>
                                            <div className="font-medium text-slate-900">{policy.commission_percent ? `${policy.commission_percent}%` : "—"}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs mb-0.5">Commission</div>
                                            <div className="font-semibold text-emerald-700">{formatCurrency(policy.commission)}</div>
                                        </div>
                                        {policy.sub_commission > 0 && (
                                            <div>
                                                <div className="text-slate-500 text-xs mb-0.5">Sub Commission</div>
                                                <div className="font-medium text-slate-900">{formatCurrency(policy.sub_commission)}</div>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-slate-500 text-xs mb-0.5">Profit</div>
                                            <div className="font-semibold text-indigo-700">{formatCurrency(policy.profit)}</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* ─── PROFILE TAB ─── */}
                <TabsContent value="profile" className="outline-none">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">Client Details</h3>
                        <Button variant="outline" size="sm" className="text-indigo-600 bg-indigo-50 border-transparent hover:bg-indigo-100 hover:text-indigo-700" onClick={openEditDialog}>
                            <Edit className="w-4 h-4 mr-1.5" /> Edit Details
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Contact Info */}
                        <Card className="rounded-xl border-slate-200 shadow-sm">
                            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="text-sm font-semibold text-slate-700">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-1">
                                <InfoRow label="Full Name" value={customer.customer_name} icon={<User className="w-4 h-4" />} />
                                <InfoRow label="Mobile Number" value={customer.mobile_no} icon={<Phone className="w-4 h-4" />} />
                                <InfoRow label="Email Address" value={customer.email} icon={<Mail className="w-4 h-4" />} />
                                <InfoRow label="Date of Birth" value={customer.date_of_birth ? formatDate(customer.date_of_birth) : null} icon={<Calendar className="w-4 h-4" />} />
                                <InfoRow label="Address" value={customer.address} icon={<MapPin className="w-4 h-4" />} />
                            </CardContent>
                        </Card>

                        {/* Other Details */}
                        <Card className="rounded-xl border-slate-200 shadow-sm">
                            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50">
                                <CardTitle className="text-sm font-semibold text-slate-700">Other Details</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-2 pb-1">
                                <InfoRow label="ID Type" value={customer.id_type} />
                                <InfoRow label="ID Number" value={customer.id_number} />
                                <InfoRow label="Status" value={statusLabel} />
                                <InfoRow label="Source" value={customer.source} />
                                <InfoRow label="Reference" value={customer.reference_name} />
                                <InfoRow label="Notes" value={customer.notes} />
                                <InfoRow label="Joined" value={formatDate(customer.created_at)} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ─── DOCUMENTS TAB ─── */}
                <TabsContent value="documents" className="outline-none">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">Documents</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-indigo-600 bg-indigo-50 border-transparent hover:bg-indigo-100 hover:text-indigo-700"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadDocument.isPending}
                        >
                            {uploadDocument.isPending ? (
                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-1.5" />
                            )}
                            {uploadDocument.isPending ? "Uploading..." : "Upload"}
                        </Button>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        onChange={handleFileUpload}
                    />

                    {docsLoading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading documents...
                        </div>
                    ) : !documents?.length ? (
                        <div
                            className="text-center py-12 text-slate-500 border border-dashed rounded-xl border-slate-200 bg-slate-50 cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-200 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-medium">No documents uploaded yet</p>
                            <p className="text-sm mt-1 text-slate-400">Click to upload PDF, JPG, PNG, DOCX (max 10MB)</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map(doc => {
                                const isImage = doc.mime_type?.startsWith("image/");
                                return (
                                    <div key={doc.id} className="bg-white border rounded-xl p-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isImage ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}>
                                            {isImage ? <FileImage className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-slate-900 truncate text-sm">{doc.document_name}</div>
                                            <div className="text-xs text-slate-500">{doc.document_type?.replace(/_/g, " ")} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : ""} · {formatDate(doc.created_at)}</div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-indigo-600"
                                                onClick={async () => {
                                                    try {
                                                        const supabase = (await import("@/lib/supabase/client")).createClient();
                                                        const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 3600);
                                                        if (error) throw error;
                                                        window.open(data.signedUrl, "_blank");
                                                    } catch {
                                                        toast.error("Failed to download");
                                                    }
                                                }}
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-400 hover:text-red-600"
                                                onClick={async () => {
                                                    if (!confirm("Delete this document?")) return;
                                                    try {
                                                        await deleteDocument.mutateAsync({ id: doc.id, filePath: doc.file_path });
                                                        toast.success("Document deleted");
                                                    } catch {
                                                        toast.error("Failed to delete document");
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            <div
                                className="text-center py-4 text-slate-400 border border-dashed rounded-xl border-slate-200 cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-200 hover:text-indigo-600 transition-colors text-sm"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="w-5 h-5 mx-auto mb-1" />
                                Upload More Documents
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Edit Customer Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="customer_name">Name *</Label>
                            <Input
                                id="customer_name"
                                value={formData.customer_name}
                                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                placeholder="Full name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="mobile_no">Mobile</Label>
                                <Input
                                    id="mobile_no"
                                    value={formData.mobile_no}
                                    onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value })}
                                    placeholder="10-digit mobile"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date_of_birth">Date of Birth</Label>
                            <Input
                                id="date_of_birth"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="id_type">ID Type</Label>
                                <Select value={formData.id_type} onValueChange={(v) => setFormData({ ...formData, id_type: v })}>
                                    <SelectTrigger id="id_type">
                                        <SelectValue placeholder="Select ID type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                                        <SelectItem value="PAN">PAN</SelectItem>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="Driving License">Driving License</SelectItem>
                                        <SelectItem value="Voter ID">Voter ID</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="id_number">ID Number</Label>
                                <Input
                                    id="id_number"
                                    value={formData.id_number}
                                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                                    placeholder="ID number"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as typeof formData.status })}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="prospect">Lead</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="churned">Churned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="source">Source</Label>
                                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                                    <SelectTrigger id="source">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Referral">Referral</SelectItem>
                                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                                        <SelectItem value="Online">Online</SelectItem>
                                        <SelectItem value="Social Media">Social Media</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="reference_name">Referred By</Label>
                            <Input
                                id="reference_name"
                                value={formData.reference_name}
                                onChange={(e) => setFormData({ ...formData, reference_name: e.target.value })}
                                placeholder="Referrer name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Full address"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={updateCustomer.isPending || !formData.customer_name}>
                            {updateCustomer.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
