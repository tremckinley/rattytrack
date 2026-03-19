"use client";

import { useState } from "react";
import { signup } from "@/app/auth/actions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEnvelope, faLock, faExclamationCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

export default function SignupPage() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl border border-foreground">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-rose-950">Join CapyTrack</h1>
                    <p className="mt-2 text-gray-500">Create an account to track legislative activity</p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 flex items-center gap-2">
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-base" />
                        {error}
                    </div>
                )}

                <form
                    action={async (formData) => {
                        setIsLoading(true);
                        await signup(formData);
                        // Redirection handled in action
                    }}
                    className="space-y-4"
                >
                    <div>
                        <label className="font-semibold text-gray-700 mb-1">Email Address</label>
                        <div className="relative">
                            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-foreground focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-black"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="font-semibold text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-black"
                                placeholder="••••••••"
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500 italic">Minimum 6 characters</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-rose-950 hover:bg-rose-900 text-white font-bold transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" /> : "Create Account"}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="text-rose-700 font-bold hover:underline">
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    );
}
