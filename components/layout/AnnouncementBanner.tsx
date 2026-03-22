"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircleInfo,
    faTriangleExclamation,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";

interface BannerData {
    enabled: boolean;
    message: string;
    type: "info" | "warning";
}

export default function AnnouncementBanner() {
    const [banner, setBanner] = useState<BannerData | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const res = await fetch("/api/admin/banner");
                const data = await res.json();
                if (data.banner && data.banner.enabled && data.banner.message) {
                    setBanner(data.banner);
                }
            } catch {
                // Silently fail — banner is non-critical
            }
        };
        fetchBanner();
    }, []);

    if (!banner || dismissed) return null;

    const isInfo = banner.type === "info";

    return (
        <div
            className={`w-full flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium border-b ${
                isInfo
                    ? "bg-sky-100 text-sky-800 border-sky-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
            }`}
        >
            <FontAwesomeIcon
                icon={isInfo ? faCircleInfo : faTriangleExclamation}
                className="text-base flex-shrink-0"
            />
            <span className="flex-1 text-center">{banner.message}</span>
            <button
                onClick={() => setDismissed(true)}
                className={`flex-shrink-0 p-1 rounded transition-colors ${
                    isInfo
                        ? "hover:bg-sky-200 text-sky-600"
                        : "hover:bg-amber-200 text-amber-600"
                }`}
                aria-label="Dismiss banner"
            >
                <FontAwesomeIcon icon={faXmark} className="text-base" />
            </button>
        </div>
    );
}
