'use client';

// Meeting transcription button component
// Handles transcription requests directly on meeting pages with page refresh on completion

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type TranscriptionStatus = 'idle' | 'pending' | 'transcribing' | 'completed' | 'error';

interface MeetingTranscribeButtonProps {
    videoId: string;
    meetingId: string;
    initialStatus?: TranscriptionStatus;
}

export default function MeetingTranscribeButton({
    videoId,
    meetingId,
    initialStatus = 'idle',
}: MeetingTranscribeButtonProps) {
    const router = useRouter();
    const [status, setStatus] = useState<TranscriptionStatus>(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');

    // Poll for status updates when processing
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (status === 'transcribing') {
            interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/transcribe/youtube?videoId=${videoId}`);
                    const data = await response.json();

                    if (data.transcription) {
                        const newStatus = data.transcription.status as TranscriptionStatus;
                        setStatus(newStatus);

                        // Refresh page when completed to show transcript
                        if (newStatus === 'completed') {
                            clearInterval(interval);
                            router.refresh();
                        }

                        if (newStatus === 'error') {
                            clearInterval(interval);
                            setError(data.transcription.error_message || 'Transcription failed');
                        }
                    }
                } catch (err) {
                    console.error('Error polling status:', err);
                }
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [status, videoId, router]);

    const handleTranscribe = async () => {
        if (!password) {
            setError('Password is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/transcribe/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start transcription');
            }

            if (data.alreadyExists) {
                setStatus('completed');
                router.refresh();
            } else if (data.processing) {
                setStatus('transcribing');
            }
        } catch (err) {
            console.error('Error starting transcription:', err);
            setError(err instanceof Error ? err.message : 'Failed to start transcription');
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Completed state - transcript is now showing on page
    if (status === 'completed') {
        return (
            <div className="flex items-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Transcript available - scroll down to view</span>
            </div>
        );
    }

    // Processing state
    if (status === 'transcribing') {
        return (
            <div className="flex items-center gap-3 mt-4">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-800 font-medium">
                    Processing transcription... This may take several minutes.
                </span>
            </div>
        );
    }

    // Error or idle state - show transcribe form
    return (
        <div className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to transcribe"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 flex-1"
                />
                <button
                    onClick={handleTranscribe}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2 justify-center whitespace-nowrap"
                >
                    {isLoading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {isLoading ? 'Starting...' : status === 'error' ? 'Retry Transcription' : 'Start Transcription'}
                </button>
            </div>
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
            <p className="text-sm text-gray-600">
                Transcription uses AI and may take 5-15 minutes for long meetings.
            </p>
        </div>
    );
}
