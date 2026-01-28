"use client";

import { useState } from "react";
import { login } from "@/app/auth/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-rose-950">Welcome</h1>
                    <p className="mt-2 text-gray-500">Sign in to your CapyTrack account</p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {message && (
                    <div className="p-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} />
                        {message}
                    </div>
                )}

                <form
                    action={async (formData) => {
                        setIsLoading(true);
                        await login(formData);
                        // Redirection handled in action
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="font-semibold text-gray-700">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-black"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-gray-700">Password</label>
                            <Link href="/auth/forgot-password" className="text-sm text-rose-700 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-black"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-rose-950 hover:bg-rose-900 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                    </button>
                </form>

                <div className="space-y-2 text-center text-sm text-gray-500">
                    <div>
                        Don't have an account?{" "}
                        <Link href="/signup" className="text-rose-700 font-bold hover:underline">
                            Register for free
                        </Link>
                    </div>
                    <div>
                        Need to{" "}
                        <Link href="/auth/forgot-password" title="Send a reset link to your email" className="text-rose-700 font-bold hover:underline">
                            Change your password?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
