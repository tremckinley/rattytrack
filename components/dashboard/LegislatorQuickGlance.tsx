// LegislatorQuickGlance — Horizontal scroll strip of legislator mini-cards

import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import type { LegislatorQuickCard } from '@/lib/data/legislators/legislator_card';

interface LegislatorQuickGlanceProps {
    legislators: LegislatorQuickCard[];
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function getAttendanceRate(attended: number | null, missed: number | null): number | null {
    if (attended === null && missed === null) return null;
    const total = (attended || 0) + (missed || 0);
    if (total === 0) return null;
    return Math.round(((attended || 0) / total) * 100);
}

export default function LegislatorQuickGlance({ legislators }: LegislatorQuickGlanceProps) {
    if (!legislators || legislators.length === 0) {
        return (
            <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FontAwesomeIcon icon={faUsers} className="text-capyred" />
                    <h3 className="text-lg font-bold">Council Members</h3>
                </div>
                <p className="text-gray-500 text-sm">No legislators tracked yet.</p>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faUsers} className="text-capyred" />
                    <h3 className="text-lg font-bold">Council Members</h3>
                </div>
                <Link href="/legislators" className="text-sm text-capyred hover:underline font-medium">
                    View All →
                </Link>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 -mb-2 scrollbar-thin">
                {legislators.map((legislator) => {
                    const rate = getAttendanceRate(legislator.meetings_attended, legislator.meetings_missed);

                    return (
                        <Link
                            key={legislator.id}
                            href={`/legislators/${legislator.id}`}
                            className="shrink-0 w-36 flex flex-col items-center p-4 border border-gray-200 hover:border-capyred hover:shadow-sm transition-all group text-center"
                        >
                            {/* Photo or Initials */}
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-rose-100 flex items-center justify-center mb-2 border-2 border-gray-200 group-hover:border-capyred transition-colors">
                                {legislator.photo_url ? (
                                    <Image
                                        src={legislator.photo_url}
                                        alt={legislator.display_name}
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-lg font-bold text-capyred">
                                        {getInitials(legislator.display_name)}
                                    </span>
                                )}
                            </div>

                            {/* Name */}
                            <p className="text-sm font-semibold text-foreground group-hover:text-capyred transition-colors truncate w-full">
                                {legislator.display_name}
                            </p>

                            {/* District */}
                            {legislator.district && (
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">
                                    {legislator.district}
                                </p>
                            )}

                            {/* Attendance rate */}
                            {rate !== null && (
                                <div className="flex items-center gap-1 mt-2">
                                    <FontAwesomeIcon
                                        icon={rate >= 80 ? faCheckCircle : faTimesCircle}
                                        className={`text-xs ${rate >= 80 ? 'text-green-500' : 'text-orange-500'}`}
                                    />
                                    <span className={`text-xs font-mono ${rate >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
                                        {rate}% attend.
                                    </span>
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
