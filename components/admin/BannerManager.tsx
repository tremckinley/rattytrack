"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBullhorn,
    faCircleInfo,
    faTriangleExclamation,
    faSave,
    faSpinner,
    faCheckCircle,
    faExclamationCircle,
    faToggleOn,
    faToggleOff,
} from "@fortawesome/free-solid-svg-icons";

interface BannerState {
    enabled: boolean;
    message: string;
    type: "info" | "warning";
}

export default function BannerManager() {
    const [banner, setBanner] = useState<BannerState>({
        enabled: false,
        message: "",
        type: "info",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    useEffect(() => {
        fetchBanner();
    }, []);

    const fetchBanner = async () => {
        try {
            const res = await fetch("/api/admin/banner");
            const data = await res.json();
            if (data.banner) {
                setBanner({
                    enabled: data.banner.enabled,
                    message: data.banner.message,
                    type: data.banner.type,
                });
            }
        } catch (err) {
            console.error("Error fetching banner:", err);
        } finally {
            setLoading(false);
        }
    };

    const saveBanner = async () => {
        setSaving(true);
        setResult(null);
        try {
            const res = await fetch("/api/admin/banner", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(banner),
            });
            const data = await res.json();
            if (res.ok) {
                setResult({ success: true, message: "Banner updated successfully" });
            } else {
                setResult({
                    success: false,
                    message: data.error || "Failed to update banner",
                });
            }
        } catch {
            setResult({ success: false, message: "Network error" });
        } finally {
            setSaving(false);
            setTimeout(() => setResult(null), 4000);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg text-gray-400" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-5">
            {/* Enable/Disable toggle */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Banner Active</span>
                <button
                    onClick={() => setBanner((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    className="text-3xl transition-colors"
                    title={banner.enabled ? "Disable banner" : "Enable banner"}
                >
                    <FontAwesomeIcon
                        icon={banner.enabled ? faToggleOn : faToggleOff}
                        className={banner.enabled ? "text-green-500" : "text-gray-300"}
                    />
                </button>
            </div>

            {/* Message input */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Banner Message
                </label>
                <textarea
                    value={banner.message}
                    onChange={(e) =>
                        setBanner((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="e.g. This site is currently in beta."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
                />
            </div>

            {/* Type selector */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Banner Type
                </label>
                <div className="flex gap-3">
                    <button
                        onClick={() => setBanner((prev) => ({ ...prev, type: "info" }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${
                            banner.type === "info"
                                ? "bg-sky-100 border-sky-400 text-sky-800 ring-2 ring-sky-300"
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-sky-50"
                        }`}
                    >
                        <FontAwesomeIcon icon={faCircleInfo} />
                        Info
                    </button>
                    <button
                        onClick={() => setBanner((prev) => ({ ...prev, type: "warning" }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${
                            banner.type === "warning"
                                ? "bg-amber-100 border-amber-400 text-amber-800 ring-2 ring-amber-300"
                                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-amber-50"
                        }`}
                    >
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        Warning
                    </button>
                </div>
            </div>

            {/* Live preview */}
            {banner.message && (
                <div>
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                        Preview
                    </span>
                    <div
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg ${
                            banner.type === "info"
                                ? "bg-sky-100 text-sky-800 border-sky-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                    >
                        <FontAwesomeIcon
                            icon={
                                banner.type === "info"
                                    ? faCircleInfo
                                    : faTriangleExclamation
                            }
                            className="text-base flex-shrink-0"
                        />
                        <span>{banner.message}</span>
                    </div>
                </div>
            )}

            {/* Result feedback */}
            {result && (
                <div
                    className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                        result.success
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                    }`}
                >
                    <FontAwesomeIcon
                        icon={result.success ? faCheckCircle : faExclamationCircle}
                        className="text-sm"
                    />
                    <span>{result.message}</span>
                </div>
            )}

            {/* Save button */}
            <button
                onClick={saveBanner}
                disabled={saving}
                className="w-full py-2 bg-rose-950 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-900 transition-colors disabled:opacity-50"
            >
                {saving ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-base" />
                ) : (
                    <FontAwesomeIcon icon={faSave} className="text-sm" />
                )}
                {saving ? "Saving..." : "Save Banner"}
            </button>
        </div>
    );
}
