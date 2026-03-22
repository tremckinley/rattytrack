import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { supabaseAdmin } from '@/lib/utils/supabase-admin';
import { notFound } from 'next/navigation';
import TranscriptEditor from '@/components/admin/TranscriptEditor';

type Props = {
    params: Promise<{ meetingId: string }>;
};

export default async function QAEditorPage({ params }: Props) {
    const { meetingId } = await params;

    // Fetch the transcription
    const { data: transcription, error: tError } = await supabaseAdmin
        .from('video_transcriptions')
        .select('*')
        .eq('video_id', meetingId)
        .single();

    if (tError || !transcription) {
        notFound();
    }

    // Fetch segments
    const { data: segments, error: sError } = await supabaseAdmin
        .from('transcription_segments')
        .select('*')
        .eq('video_id', meetingId)
        .order('start_time', { ascending: true });

    // Fetch legislators for speaker dropdown
    const { data: legislators } = await supabaseAdmin
        .from('legislators')
        .select('id, display_name')
        .eq('is_active', true)
        .order('display_name');

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin/qa" className="text-gray-400 hover:text-capyred transition-colors">
                        <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
                    </Link>
                    <div className="p-3 bg-rose-950 text-white rounded-xl shadow-lg">
                        <FontAwesomeIcon icon={faClipboardCheck} className="text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900 border-none truncate">
                            {transcription.title || meetingId}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {segments?.length ?? 0} segments • Status: {transcription.status}
                        </p>
                    </div>
                </div>

                {sError ? (
                    <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-red-700">
                        <p className="font-bold">Error loading segments</p>
                        <p className="text-sm mt-1">{sError.message}</p>
                    </div>
                ) : !segments || segments.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
                        <p className="text-gray-400 text-lg">No transcript segments found.</p>
                    </div>
                ) : (
                    <TranscriptEditor
                        segments={segments}
                        legislators={legislators || []}
                    />
                )}
            </div>
        </div>
    );
}
