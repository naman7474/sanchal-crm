"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Search, Upload, FileText, FileImage, Download, MoreVertical, Calendar, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/lib/hooks/use-documents";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function DocumentsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { data: allDocuments, isLoading } = useDocuments();
    const uploadDocument = useUploadDocument();
    const deleteDocument = useDeleteDocument();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Client-side search filter
    const documents = allDocuments?.filter(doc => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return doc.document_name?.toLowerCase().includes(q) ||
            doc.customers?.customer_name?.toLowerCase().includes(q);
    }) ?? [];

    function formatFileSize(bytes: number | null): string {
        if (!bytes) return "—";
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    }

    async function handleDownload(filePath: string, fileName: string) {
        try {
            const supabase = createClient();
            const { data, error } = await supabase.storage
                .from("documents")
                .createSignedUrl(filePath, 3600);
            if (error) throw error;
            window.open(data.signedUrl, "_blank");
        } catch {
            toast.error("Failed to download file");
        }
    }

    async function handleDelete(id: string, filePath: string) {
        if (!confirm("Delete this document?")) return;
        try {
            await deleteDocument.mutateAsync({ id, filePath });
            toast.success("Document deleted");
        } catch {
            toast.error("Failed to delete document");
        }
    }

    const fileType = (name: string): "pdf" | "image" => {
        return name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "pdf";
    };

    return (
        <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Documents</h1>
                    <p className="text-sm text-slate-500 mt-1">Centralized storage for all customer and policy files</p>
                </div>
                <Button
                    onClick={() => toast.info("Select a customer first to upload documents. Go to a customer's profile page.")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full md:w-auto h-11"
                >
                    <Upload className="w-5 h-5 mr-2" /> Upload Document
                </Button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search documents by name or customer..."
                        className="pl-9 bg-slate-50 border-transparent focus-visible:bg-white focus-visible:ring-indigo-600 transition-colors h-11 text-[15px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading documents...
                </div>
            ) : !documents.length ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-4xl mb-3">📁</p>
                    <p className="text-slate-900 font-semibold mb-1">No documents yet</p>
                    <p className="text-sm text-slate-500">Upload documents from a customer&apos;s profile page</p>
                </div>
            ) : (
                <>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                        {documents.map(doc => (
                            <div key={doc.id} className="bg-white border text-card-foreground shadow-sm rounded-xl p-4 flex items-center gap-4 relative">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${fileType(doc.document_name) === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                    {fileType(doc.document_name) === "pdf" ? <FileText className="w-6 h-6" /> : <FileImage className="w-6 h-6" />}
                                </div>

                                <div className="flex-1 min-w-0 pr-8">
                                    <h3 className="font-semibold text-[15px] text-slate-900 truncate" title={doc.document_name}>{doc.document_name}</h3>
                                    <p className="text-[13px] text-slate-500 truncate mt-0.5">{doc.customers?.customer_name || "—"}</p>
                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-medium whitespace-nowrap">
                                        <span>{formatFileSize(doc.file_size)}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full flex-shrink-0"></span>
                                        <span>{new Date(doc.created_at).toLocaleDateString("en-GB")}</span>
                                    </div>
                                </div>

                                <div className="absolute top-2 right-2 flex flex-col gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => handleDownload(doc.file_path, doc.document_name)}>
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[13px] uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-xl">File Name</th>
                                    <th className="px-6 py-4">Related To</th>
                                    <th className="px-6 py-4">Size</th>
                                    <th className="px-6 py-4">Uploaded</th>
                                    <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fileType(doc.document_name) === "pdf" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                                    {fileType(doc.document_name) === "pdf" ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                                                </div>
                                                <div className="font-medium text-slate-900 max-w-[250px] truncate" title={doc.document_name}>
                                                    {doc.document_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">
                                            {doc.customers?.customer_name || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {formatFileSize(doc.file_size)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(doc.created_at).toLocaleDateString("en-GB")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600" onClick={() => handleDownload(doc.file_path, doc.document_name)}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600" onClick={() => handleDelete(doc.id, doc.file_path)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
