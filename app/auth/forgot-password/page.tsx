"use client";

import { useState } from "react";
import { resetPasswordForEmail } from "@/app/auth/actions";
import Link from "next/link";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faExclamationCircle, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                    <Link href="/login" className="text-gray-400 hover:text-rose-950 transition-colors">
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xl" />
                    </Link>
                </div>

                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-rose-950">Reset Password</h1>
                    <p className="mt-2 text-gray-500">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                <form
                    action={async (formData) => {
                        setIsLoading(true);
                        await resetPasswordForEmail(formData);
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
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-black"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-rose-950 hover:bg-rose-900 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" /> : "Send Reset Link"}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-500">
                    Remember your password?{" "}
                    <Link href="/login" className="text-rose-700 font-bold hover:underline">
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    );
}
