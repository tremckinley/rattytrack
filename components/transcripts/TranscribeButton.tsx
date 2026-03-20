'use client';

// TranscribeButton — Unified transcription component
// Handles transcription requests, polling, and status display.
// Used on YouTube page with onComplete callback for navigation.

import { useState, useEffect } from 'react';

type TranscriptionStatus = 'idle' | 'pending' | 'processing' | 'downloading' | 'transcribing' | 'completed' | 'error';

interface TranscribeButtonProps {
    videoId: string;
    initialStatus?: TranscriptionStatus;
    /** Called when transcription completes successfully */
    onComplete?: () => void;
    /** Called on any status change */
    onStatusChange?: (status: TranscriptionStatus) => void;
}

export default function TranscribeButton({
    videoId,
    initialStatus = 'idle',
    onComplete,
    onStatusChange,
}: TranscribeButtonProps) {
    const [status, setStatus] = useState<TranscriptionStatus>(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');

    // Poll for status updates when processing
    useEffect(() => {
        if (status !== 'transcribing') return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/transcribe/youtube?videoId=${videoId}`);
                const data = await response.json();

                if (data.transcription) {
                    const newStatus = data.transcription.status as TranscriptionStatus;
                    setStatus(newStatus);
                    onStatusChange?.(newStatus);

                    if (newStatus === 'completed') {
                        clearInterval(interval);
                        onComplete?.();
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
    }, [status, videoId, onComplete, onStatusChange]);

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
                onStatusChange?.('completed');
                onComplete?.();
            } else if (data.processing) {
                setStatus('transcribing');
                onStatusChange?.('transcribing');
            }
        } catch (err) {
            console.error('Error starting transcription:', err);
            setError(err instanceof Error ? err.message : 'Failed to start transcription');
            setStatus('error');
            onStatusChange?.('error');
        } finally {
            setIsLoading(false);
        }
    };

    // Completed state
    if (status === 'completed') {
        return (
            <div className="flex items-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Transcript available</span>
            </div>
        );
    }

    // Processing state
    if (status === 'transcribing') {
        return (
            <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium flex items-center gap-2"
            >
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
            </button>
        );
    }

    // Error or idle state — show transcribe form
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black flex-1"
                />
                <button
                    onClick={handleTranscribe}
                    disabled={isLoading}
                    className={`px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2 justify-center whitespace-nowrap ${
                        status === 'error'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {isLoading && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {isLoading ? 'Starting...' : status === 'error' ? 'Retry Transcription' : 'Transcribe'}
                </button>
            </div>
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
