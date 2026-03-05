"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
            setIsLoading(false);
            return;
        }

        toast.success("Welcome back!");
        router.push("/");
        router.refresh();
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans">
            <div className="w-full max-w-[420px]">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-indigo-500/20">
                        S
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
                    <p className="text-sm text-slate-500 mt-1">Sign in to manage your insurance portfolio</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-5">
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
                                placeholder="Enter your password"
                                required
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
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700">
                        Sign up
                    </Link>
                </p>
                <p className="text-center text-[11px] text-slate-400 mt-4">Powered by <span className="font-semibold text-indigo-500">Sanchal</span></p>
            </div>
        </div>
    );
}
