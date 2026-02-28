"use client";

import { Suspense } from "react";
import { PolicyForm } from "@/components/policies/PolicyForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AddPolicyPage() {
    return (
        <div className="p-4 md:p-6 max-w-[1280px] mx-auto w-full">
            {/* Header Area */}
            <div className="mb-6 flex flex-col items-start gap-4">
                <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-900 -ml-2 h-8 px-2">
                    <Link href="/policies">
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Policies
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add New Policy</h1>
                    <p className="text-sm text-slate-500 mt-1">Create a new insurance policy entry for a customer</p>
                </div>
            </div>

            <Suspense fallback={<div className="flex items-center justify-center py-12 text-slate-400">Loading form...</div>}>
                <PolicyForm />
            </Suspense>
        </div>
    );
}
