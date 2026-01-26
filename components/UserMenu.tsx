"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Shield, Key, ChevronDown, Settings } from "lucide-react";
import { signOut } from "@/app/auth/actions";

interface UserMenuProps {
    user: any;
    isAdmin: boolean;
}

export default function UserMenu({ user, isAdmin }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={toggleMenu}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-all group"
            >
                <div className="w-7 h-7 bg-rose-950 text-white rounded-full flex items-center justify-center">
                    <User size={16} />
                </div>
                <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Signed in as</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                    </div>

                    <div className="py-2">
                        {isAdmin && (
                            <Link
                                href="/admin"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                            >
                                <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                                    <Shield size={16} />
                                </div>
                                <span className="font-semibold">Admin Dashboard</span>
                            </Link>
                        )}

                        <Link
                            href="/auth/update-password"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <div className="p-1.5 bg-gray-100 text-gray-600 rounded-lg">
                                <Key size={16} />
                            </div>
                            <span className="font-semibold">Change Password</span>
                        </Link>

                        <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed opacity-50">
                            <div className="p-1.5 bg-gray-100 rounded-lg">
                                <Settings size={16} />
                            </div>
                            <span className="font-semibold">Settings (Soon)</span>
                        </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-50">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                signOut();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                                <LogOut size={16} />
                            </div>
                            <span className="font-bold">Sign Out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
