// WatchdogAlerts — Teaser/coming-soon card for keyword alert feature

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faLock, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function WatchdogAlerts() {
    return (
        <div className="card p-6 border-l-4 border-l-capyred relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faBell} className="text-capyred" />
                <h3 className="text-lg font-bold">Watchdog Alerts</h3>
                <span className="px-2 py-0.5 bg-rose-100 text-capyred text-[10px] font-bold uppercase tracking-wider rounded">
                    Coming Soon
                </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Get notified when specific topics are discussed in council meetings. 
                Set up keyword alerts for the issues you care about most.
            </p>

            {/* Preview of what alerts could look like */}
            <div className="space-y-2 mb-4 opacity-50">
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200">
                    <div className="w-2 h-2 bg-capyred rounded-full" />
                    <span className="text-xs text-gray-600">&ldquo;Protected Bike Lane&rdquo; mentioned in 2 meetings this month</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    <span className="text-xs text-gray-600">&ldquo;Zoning Variance&rdquo; — new agenda item for next session</span>
                </div>
            </div>

            <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-bold text-capyred hover:underline"
            >
                <FontAwesomeIcon icon={faLock} className="text-xs" />
                Sign up to unlock alerts
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
            </Link>

            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-rose-50 to-transparent pointer-events-none" />
        </div>
    );
}
