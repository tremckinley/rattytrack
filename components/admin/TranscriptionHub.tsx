"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faSearch, faChevronRight, faPlay, faSpinner, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import Link from "next/link";

interface PendingMeeting {
    id: string;
    title: string;
    date: string;
    videoId: string | null;
    status: 'idle' | 'transcribing' | 'completed' | 'error';
}

export default function TranscriptionHub() {
    const [meetings, setMeetings] = useState<PendingMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [transcribing, setTranscribing] = useState<string | null>(null);
    const [providingId, setProvidingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingMeetings();
    }, []);

    const fetchPendingMeetings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/transcripts/pending");
            const data = await res.json();
            setMeetings(data.meetings || []);
        } catch (err) {
            console.error("Failed to fetch pending meetings", err);
        } finally {
            setLoading(false);
        }
    };

    const startTranscription = async (meetingId: string, videoId: string) => {
        setTranscribing(meetingId);
        try {
            const res = await fetch("/api/transcribe/granicus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clipId: videoId, forceRetry: true }),
            });
            if (res.ok) {
                // Update local state to show it's transcribing
                setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status: 'transcribing' } : m));
            }
        } catch (err) {
            console.error("Failed to start transcription", err);
        } finally {
            setTranscribing(null);
        }
    };

    const handleProvideVideoId = async (meetingId: string) => {
        const videoId = window.prompt("Enter Granicus Clip ID (e.g., 10666):");
        if (!videoId?.trim()) return;

        setProvidingId(meetingId);
        try {
            const res = await fetch(`/api/admin/meetings/${meetingId}/video`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: videoId.trim() }),
            });
            
            if (res.ok) {
                const data = await res.json();
                const actualVideoId = data.meeting?.video_id || videoId.trim();
                
                // Update local state first to show it has an ID
                setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, videoId: actualVideoId } : m));
                
                // Immediately start transcribing it
                await startTranscription(meetingId, actualVideoId);
            } else {
                alert("Failed to save video ID. Ensure you are an admin and the meeting exists.");
            }
        } catch (err) {
            console.error("Failed to provide video ID", err);
            alert("An error occurred while linking the video ID.");
        } finally {
            setProvidingId(null);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="relative flex-1 max-w-sm">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base" />
                    <input
                        type="text"
                        placeholder="Search pending meetings..."
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-rose-500 transition-all text-black"
                    />
                </div>
                <button
                    onClick={fetchPendingMeetings}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 px-3 py-2"
                >
                    Refresh List
                </button>
            </div>

            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {loading ? (
                    <div className="p-12 text-center">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-rose-950 text-2xl mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading pending meetings...</p>
                    </div>
                ) : meetings.length > 0 ? (
                    meetings.map((meeting) => (
                        <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meeting.status === 'transcribing' ? 'bg-blue-50 text-blue-600' :
                                        meeting.status === 'error' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    {meeting.status === 'transcribing' ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" /> :
                                        meeting.status === 'error' ? <FontAwesomeIcon icon={faMicrophone} className="text-lg" /> : <FontAwesomeIcon icon={faMicrophone} className="text-lg" />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-gray-900 truncate border-none">{meeting.title}</h4>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                        <span className="flex items-center gap-1 uppercase tracking-tight">
                                            <FontAwesomeIcon icon={faClock} className="text-xs" />
                                            {new Date(meeting.date).toLocaleDateString()}
                                        </span>
                                        {meeting.status === 'transcribing' && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-blue-600 font-bold animate-pulse">Processing...</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {!meeting.videoId && meeting.status !== 'transcribing' && meeting.status !== 'completed' && (
                                    <button
                                        onClick={() => handleProvideVideoId(meeting.id)}
                                        disabled={providingId === meeting.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 shadow-sm transition-all"
                                    >
                                        {providingId === meeting.id ? (
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                                        ) : (
                                            <FontAwesomeIcon icon={faPlay} className="text-xs" />
                                        )}
                                        Link Video & Transcribe
                                    </button>
                                )}
                                {meeting.videoId && meeting.status !== 'transcribing' && meeting.status !== 'completed' && (
                                    <button
                                        onClick={() => startTranscription(meeting.id, meeting.videoId!)}
                                        disabled={transcribing === meeting.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 text-white rounded-lg text-xs font-bold hover:bg-rose-900 shadow-sm transition-all"
                                    >
                                        <FontAwesomeIcon icon={faPlay} className="text-xs" />
                                        Transcribe
                                    </button>
                                )}
                                {meeting.status === 'completed' && (
                                    <span className="text-green-600 flex items-center gap-1 text-xs font-bold">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                                        READY
                                    </span>
                                )}
                                <Link
                                    href={`/meetings/${meeting.id}`}
                                    className="p-1.5 text-gray-400 hover:text-rose-700 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faChevronRight} className="text-lg" />
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center">
                        <FontAwesomeIcon icon={faCheckCircle} className="mx-auto text-green-500 text-3xl mb-2" />
                        <p className="text-sm text-gray-800 font-bold">All meetings transcribed!</p>
                        <p className="text-xs text-gray-500 mt-1">Check back later or run "Populate Meetings" to find new ones.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
