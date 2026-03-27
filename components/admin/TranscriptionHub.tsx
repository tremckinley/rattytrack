"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faSearch, faChevronRight, faPlay, faSpinner, faCheckCircle, faClock, faMicrochip, faEdit } from '@fortawesome/free-solid-svg-icons';
import Link from "next/link";

interface PendingMeeting {
    id: string;
    title: string;
    date: string;
    videoId: string | null;
    transcriptionStatus: string;
    analysisStatus: string;
}

export default function TranscriptionHub() {
    const [meetings, setMeetings] = useState<PendingMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [providingId, setProvidingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

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
        setProcessing(meetingId);
        // Optimistically show processing state
        setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, transcriptionStatus: 'processing' } : m));
        
        try {
            const res = await fetch("/api/transcribe/granicus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clipId: videoId, forceRetry: true }),
            });
            
            if (!res.ok) {
                // Revert state on failure
                setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, transcriptionStatus: 'failed' } : m));
                const data = await res.json();
                alert(`Transcription failed: ${data.error || "Unknown error"}`);
            } else {
                alert(`Transcription queued successfully!`);
            }
        } catch (err) {
            console.error("Failed to start transcription", err);
            setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, transcriptionStatus: 'failed' } : m));
            alert("Network error: Failed to connect to server.");
        } finally {
            setProcessing(null);
        }
    };

    const startAnalysis = async (meetingId: string) => {
        setProcessing(meetingId);
        // Optimistically show processing state
        setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, analysisStatus: 'processing' } : m));
        
        try {
            const res = await fetch(`/api/admin/meetings/${meetingId}/analyze`, {
                method: "POST"
            });
            
            if (res.ok) {
                setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, analysisStatus: 'completed' } : m));
                alert(`AI Analysis completed successfully!`);
            } else {
                // Revert state on failure
                setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, analysisStatus: 'failed' } : m));
                const data = await res.json();
                alert(`Analysis failed: ${data.error || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Failed to start analysis", err);
            setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, analysisStatus: 'failed' } : m));
            alert("Network error: Failed to connect to server.");
        } finally {
            setProcessing(null);
        }
    };

    const handleProvideVideoId = async (meetingId: string, currentId: string | null = null) => {
        const videoId = window.prompt(`Enter Granicus Clip ID (e.g., 10666):`, currentId || "");
        if (videoId === null) return; // Cancelled
        if (!videoId.trim() && !currentId) return;

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
                setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, videoId: actualVideoId } : m));
                
                // If it's a new or updated ID, ask if they want to transcribe
                if (window.confirm("Video linked! Do you want to start transcription now?")) {
                    await startTranscription(meetingId, actualVideoId);
                }
            } else {
                alert("Failed to save video ID.");
            }
        } catch (err) {
            console.error("Failed to provide video ID", err);
        } finally {
            setProvidingId(null);
        }
    };

    const filteredMeetings = meetings.filter(m => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="relative flex-1 max-w-sm">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-base" />
                    <input
                        type="text"
                        placeholder="Search pending meetings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                ) : filteredMeetings.length > 0 ? (
                    filteredMeetings.map((meeting) => (
                        <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    meeting.transcriptionStatus === 'processing' || meeting.analysisStatus === 'processing' ? 'bg-blue-50 text-blue-600' :
                                    meeting.transcriptionStatus === 'failed' || meeting.analysisStatus === 'failed' ? 'bg-red-50 text-red-600' : 
                                    meeting.transcriptionStatus === 'completed' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                    {meeting.transcriptionStatus === 'processing' || meeting.analysisStatus === 'processing' ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-lg" /> :
                                        <FontAwesomeIcon icon={faMicrophone} className="text-lg" />}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-gray-900 truncate border-none">{meeting.title}</h4>
                                        {meeting.videoId && (
                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                                                ID: {meeting.videoId}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                        <span className="flex items-center gap-1 uppercase tracking-tight">
                                            <FontAwesomeIcon icon={faClock} className="text-xs" />
                                            {new Date(meeting.date).toLocaleDateString()}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className={`font-medium ${meeting.transcriptionStatus === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                                            TX: {meeting.transcriptionStatus}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className={`font-medium ${meeting.analysisStatus === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                                            AI: {meeting.analysisStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleProvideVideoId(meeting.id, meeting.videoId)}
                                    disabled={providingId === meeting.id}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                                        meeting.videoId 
                                        ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {providingId === meeting.id ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> : <FontAwesomeIcon icon={faEdit} className="text-xs" />}
                                    {meeting.videoId ? "Edit ID" : "Set ID"}
                                </button>
                                
                                {meeting.videoId && meeting.transcriptionStatus !== 'completed' && meeting.transcriptionStatus !== 'processing' && (
                                    <button
                                        onClick={() => startTranscription(meeting.id, meeting.videoId!)}
                                        disabled={processing === meeting.id}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                                            processing === meeting.id ? 'bg-amber-800 text-white/70 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700'
                                        }`}
                                    >
                                        {processing === meeting.id ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> : <FontAwesomeIcon icon={faPlay} className="text-xs" />}
                                        {processing === meeting.id ? 'Queuing...' : 'Transcribe'}
                                    </button>
                                )}

                                {meeting.transcriptionStatus === 'completed' && meeting.analysisStatus !== 'completed' && meeting.analysisStatus !== 'processing' && (
                                    <button
                                        onClick={() => startAnalysis(meeting.id)}
                                        disabled={processing === meeting.id}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                                            processing === meeting.id ? 'bg-rose-900 text-white/70 cursor-not-allowed' : 'bg-rose-950 text-white hover:bg-rose-900'
                                        }`}
                                    >
                                        {processing === meeting.id ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> : <FontAwesomeIcon icon={faMicrochip} className="text-xs" />}
                                        {processing === meeting.id ? 'Analyzing...' : 'Run AI Analysis'}
                                    </button>
                                )}

                                {(meeting.transcriptionStatus === 'processing' || meeting.analysisStatus === 'processing') && (
                                    <span className="text-blue-600 flex items-center gap-1 text-xs font-bold animate-pulse">
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm" />
                                        WORKING...
                                    </span>
                                )}

                                {meeting.transcriptionStatus === 'completed' && meeting.analysisStatus === 'completed' && (
                                    <span className="text-green-600 flex items-center gap-1 text-xs font-bold">
                                        <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                                        COMPLETE
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
                        <p className="text-sm text-gray-800 font-bold">Queue clear!</p>
                        <p className="text-xs text-gray-500 mt-1">Check back later or run "Populate Meetings" to find new ones.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
