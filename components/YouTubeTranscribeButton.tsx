'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClosedCaptioning, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

interface YouTubeTranscribeButtonProps {
  videoId: string;
  videoTitle: string;
  durationSeconds: number;
  isTranscribed: boolean;
}

export default function YouTubeTranscribeButton({
  videoId,
  videoTitle,
  durationSeconds,
  isTranscribed,
}: YouTubeTranscribeButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationMinutes = Math.floor(durationSeconds / 60);
  const isShortVideo = durationSeconds < 3600; // Less than 1 hour

  const handleTranscribe = async () => {
    // Show warning modal for short videos
    if (isShortVideo && !showWarning) {
      setShowWarning(true);
      return;
    }

    setShowWarning(false);
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/transcribe/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          forceRetranscribe: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      // Redirect to transcript page
      router.push(`/transcripts/${videoId}`);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe video');
      setIsProcessing(false);
    }
  };

  const handleGetTranscription = () => {
    router.push(`/transcripts/${videoId}`);
  };

  if (isTranscribed) {
    return (
      <button
        onClick={handleGetTranscription}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        <FontAwesomeIcon icon={faClosedCaptioning} />
        Get Transcription
      </button>
    );
  }

  return (
    <>
      {/* Main Transcribe Button */}
      <button
        onClick={handleTranscribe}
        disabled={isProcessing}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faClosedCaptioning} />
            Transcribe
          </>
        )}
      </button>

      {/* Warning Modal for Short Videos */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-yellow-500 text-2xl mt-1"
              />
              <div>
                <h3 className="font-semibold text-lg mb-2">Short Video Warning</h3>
                <p className="text-sm text-muted-foreground">
                  This video is only <strong>{durationMinutes} minutes</strong> long.
                  Transcription costs apply per minute of audio ($0.006/minute).
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  For videos under 1 hour, the cost may not be justified unless the content is critical.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTranscribe}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Transcribe Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 z-50">
          <h4 className="font-semibold mb-1">Transcription Failed</h4>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
