'use client';

// YouTube transcription button component
// Handles transcription requests and status polling

import { useState, useEffect } from 'react';
import { TranscriptionStatus } from '@/lib/types/youtube';

interface TranscribeButtonProps {
  videoId: string;
  initialStatus?: TranscriptionStatus;
  onStatusChange?: (status: TranscriptionStatus) => void;
}

export default function YouTubeTranscribeButton({
  videoId,
  initialStatus,
  onStatusChange,
}: TranscribeButtonProps) {
  const [status, setStatus] = useState<TranscriptionStatus>(initialStatus || 'pending');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Poll for status updates when processing
  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/transcribe/youtube?videoId=${videoId}`);
          const data = await response.json();

          if (data.transcription) {
            const newStatus = data.transcription.status as TranscriptionStatus;
            setStatus(newStatus);
            onStatusChange?.(newStatus);

            // Stop polling if completed or error
            if (newStatus === 'completed' || newStatus === 'error') {
              clearInterval(interval);
              setPollingInterval(null);
            }
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 5000); // Poll every 5 seconds

      setPollingInterval(interval);

      return () => {
        clearInterval(interval);
      };
    }
  }, [status, videoId, onStatusChange]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleTranscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transcribe/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start transcription');
      }

      if (data.alreadyExists) {
        setStatus('completed');
        onStatusChange?.('completed');
      } else if (data.processing) {
        setStatus('processing');
        onStatusChange?.('processing');
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

  const handleViewTranscript = () => {
    window.location.href = `/transcripts/${videoId}`;
  };

  // Render different states
  if (status === 'completed') {
    return (
      <button
        onClick={handleViewTranscript}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        View Transcript
      </button>
    );
  }

  if (status === 'processing') {
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

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleTranscribe}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
        >
          Retry Transcription
        </button>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Default: pending state
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleTranscribe}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {isLoading ? 'Starting...' : 'Transcribe'}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}