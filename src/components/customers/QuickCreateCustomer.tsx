"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Loader2, UserPlus } from "lucide-react";
import { useCreateCustomer } from "@/lib/hooks/use-customers";
import { toast } from "sonner";

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    return isMobile;
}

interface QuickCreateCustomerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function CreateForm({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const createCustomer = useCreateCustomer();
    const [form, setForm] = useState({
        customer_name: "",
        mobile_no: "",
        email: "",
    });

    const canSave = form.customer_name.trim().length > 0 && form.mobile_no.trim().length > 0;

    async function handleSave() {
        try {
            const customer = await createCustomer.mutateAsync({
                customer_name: form.customer_name.trim(),
                mobile_no: form.mobile_no.trim(),
                email: form.email.trim() || null,
                status: "active",
            });
            toast.success("Client created!");
            onClose();
            router.push(`/customers/${customer.id}`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            toast.error(message);
        }
    }

    return (
        <>
            <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                    <Label htmlFor="qc_name">Name <span className="text-red-500">*</span></Label>
                    <Input
                        id="qc_name"
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        placeholder="e.g. Dharmender Singh"
                        autoFocus
                        className="h-11"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="qc_mobile">Mobile <span className="text-red-500">*</span></Label>
                    <Input
                        id="qc_mobile"
                        value={form.mobile_no}
                        onChange={(e) => setForm({ ...form, mobile_no: e.target.value })}
                        placeholder="+91 98999-25956"
                        type="tel"
                        className="h-11"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="qc_email">Email <span className="text-slate-400 text-xs font-normal">(optional)</span></Label>
                    <Input
                        id="qc_email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@example.com"
                        type="email"
                        className="h-11"
                    />
                </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <Button variant="outline" onClick={onClose} className="h-11">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={!canSave || createCustomer.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 h-11"
                >
                    {createCustomer.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {createCustomer.isPending ? "Saving..." : "Save Client"}
                </Button>
            </div>
        </>
    );
}

export function QuickCreateCustomer({ open, onOpenChange }: QuickCreateCustomerProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="rounded-t-2xl px-5 pb-8 pt-4 max-h-[85vh]">
                    <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
                    <SheetHeader className="p-0 mb-2">
                        <SheetTitle className="text-lg flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-600" />
                            New Client
                        </SheetTitle>
                        <SheetDescription className="text-sm">
                            Add basic details. You can fill in more later.
                        </SheetDescription>
                    </SheetHeader>
                    <CreateForm onClose={() => onOpenChange(false)} />
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-indigo-600" />
                        New Client
                    </DialogTitle>
                    <DialogDescription>
                        Add basic details. You can fill in more later.
                    </DialogDescription>
                </DialogHeader>
                <CreateForm onClose={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
