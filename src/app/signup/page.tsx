"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const supabase = createClient();

    const [orgName, setOrgName] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Sign up user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        org_name: orgName,
                    },
                },
            });

            if (authError) {
                toast.error(authError.message);
                setIsLoading(false);
                return;
            }

            if (!authData.user) {
                toast.error("Signup failed. Please try again.");
                setIsLoading(false);
                return;
            }

            const userId = authData.user.id;

            // 2. Create organization
            const slug = orgName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

            const { data: org, error: orgError } = await supabase
                .from("organizations")
                .insert({
                    name: orgName,
                    slug: `${slug}-${Date.now().toString(36)}`,
                    email: email,
                })
                .select()
                .single();

            if (orgError) {
                toast.error("Failed to create organization: " + orgError.message);
                setIsLoading(false);
                return;
            }

            // 3. Create profile
            const { error: profileError } = await supabase.from("profiles").insert({
                id: userId,
                org_id: org.id,
                full_name: fullName,
                role: "owner",
                email: email,
            });

            if (profileError) {
                toast.error("Failed to create profile: " + profileError.message);
                setIsLoading(false);
                return;
            }

            // 4. Set owner_id on organization
            await supabase
                .from("organizations")
                .update({ owner_id: userId })
                .eq("id", org.id);

            // 5. Seed product types
            const productTypes = [
                { org_id: org.id, name: "2W", category: "motor", requires_vehicle: true },
                { org_id: org.id, name: "PVT CAR", category: "motor", requires_vehicle: true },
                { org_id: org.id, name: "COMMERCIAL VEHICLE", category: "motor", requires_vehicle: true },
                { org_id: org.id, name: "HEALTH", category: "health", requires_vehicle: false },
                { org_id: org.id, name: "LIFE", category: "life", requires_vehicle: false },
                { org_id: org.id, name: "TERM", category: "life", requires_vehicle: false },
                { org_id: org.id, name: "TRAVEL", category: "general", requires_vehicle: false },
                { org_id: org.id, name: "FIRE", category: "general", requires_vehicle: false },
                { org_id: org.id, name: "MARINE", category: "general", requires_vehicle: false },
                { org_id: org.id, name: "PA (Personal Accident)", category: "general", requires_vehicle: false },
            ];
            await supabase.from("product_types").insert(productTypes);

            // 6. Seed insurance companies
            const companies = [
                { org_id: org.id, name: "GO DIGIT GENERAL INSURANCE", short_name: "Go Digit" },
                { org_id: org.id, name: "RELIANCE GENERAL INSURANCE", short_name: "Reliance" },
                { org_id: org.id, name: "ZURICH KOTAK GENERAL INSURANCE", short_name: "Zurich Kotak" },
                { org_id: org.id, name: "SHRIRAM GENERAL INSURANCE", short_name: "Shriram" },
                { org_id: org.id, name: "ICICI LOMBARD", short_name: "ICICI Lombard" },
                { org_id: org.id, name: "HDFC ERGO", short_name: "HDFC Ergo" },
                { org_id: org.id, name: "BAJAJ ALLIANZ", short_name: "Bajaj Allianz" },
                { org_id: org.id, name: "TATA AIG", short_name: "Tata AIG" },
                { org_id: org.id, name: "NEW INDIA ASSURANCE", short_name: "New India" },
                { org_id: org.id, name: "UNITED INDIA INSURANCE", short_name: "United India" },
                { org_id: org.id, name: "NATIONAL INSURANCE", short_name: "National" },
                { org_id: org.id, name: "LIC", short_name: "LIC" },
                { org_id: org.id, name: "SBI LIFE", short_name: "SBI Life" },
                { org_id: org.id, name: "MAX LIFE", short_name: "Max Life" },
                { org_id: org.id, name: "STAR HEALTH", short_name: "Star Health" },
            ];
            await supabase.from("insurance_companies").insert(companies);

            toast.success("Account created! Welcome to Kavach 🛡️");
            router.push("/");
            router.refresh();
        } catch (err) {
            toast.error("Something went wrong. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
            <div className="w-full max-w-[420px]">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-indigo-500/20">
                        K
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h1>
                    <p className="text-sm text-slate-500 mt-1">Start managing your insurance portfolio for free</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSignup} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Agency / Business Name</label>
                        <input
                            type="text"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="e.g. Rajesh Insurance Agency"
                            required
                            className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Your Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Rajesh Kumar"
                            required
                            className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                required
                                minLength={6}
                                className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLoading ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="text-xs text-center text-slate-400">
                        14-day free trial · No credit card required
                    </p>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
