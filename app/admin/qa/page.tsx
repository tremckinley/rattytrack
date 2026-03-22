import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faArrowLeft, faCircle } from '@fortawesome/free-solid-svg-icons';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';

const STATUS_STYLES: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    needs_review: 'bg-orange-100 text-orange-700',
    failed: 'bg-red-100 text-red-700',
};

export default async function QAQueuePage() {
    const { data: transcriptions, error } = await supabaseAdmin
        .from('video_transcriptions')
        .select(`
            video_id,
            title,
            status,
            created_at,
            transcription_segments (count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-gray-400 hover:text-capyred transition-colors">
                        <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
                    </Link>
                    <div className="p-3 bg-rose-950 text-white rounded-xl shadow-lg">
                        <FontAwesomeIcon icon={faClipboardCheck} className="text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 border-none">Data QA Queue</h1>
                        <p className="text-gray-500 text-sm">Review and correct transcribed meeting data</p>
                    </div>
                </div>

                {error ? (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
                        <p className="font-bold">Error loading QA queue</p>
                        <p className="text-sm mt-1">{error.message}</p>
                    </div>
                ) : !transcriptions || transcriptions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
                        <p className="text-gray-400 text-lg">No transcriptions found.</p>
                        <p className="text-gray-400 text-sm mt-2">Transcriptions will appear here after processing.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transcriptions.map((t: any) => {
                            const segmentCount = t.transcription_segments?.[0]?.count ?? 0;
                            const statusClass = STATUS_STYLES[t.status] || 'bg-gray-100 text-gray-600';

                            return (
                                <Link
                                    key={t.video_id}
                                    href={`/admin/qa/${t.video_id}`}
                                    className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-capyred hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 group-hover:text-capyred transition-colors truncate border-none">
                                                {t.title || t.video_id}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{new Date(t.created_at).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{segmentCount} segments</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${statusClass}`}>
                                                <FontAwesomeIcon icon={faCircle} className="text-[5px] mr-1" />
                                                {t.status}
                                            </span>
                                            <span className="text-gray-300 group-hover:text-capyred transition-colors">→</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
