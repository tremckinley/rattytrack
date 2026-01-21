'use client';

// Client wrapper for MeetingSummary to handle summary generation
// Provides the onGenerateSummary handler that calls the API

import { useState } from 'react';
import MeetingSummary from './MeetingSummary';

interface MeetingSummaryWrapperProps {
    initialSummary: {
        id: string;
        summary_text: string;
        key_points: string[];
        decisions: string[];
        votes_overview: Array<{
            item: string;
            result: 'passed' | 'failed';
        }>;
        generated_at: string;
        is_approved: boolean;
    } | null;
    videoId: string;
}

export default function MeetingSummaryWrapper({
    initialSummary,
    videoId,
}: MeetingSummaryWrapperProps) {
    const [summary, setSummary] = useState(initialSummary);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSummary = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate summary');
            }

            setSummary(data.summary);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate summary');
            console.error('Error generating summary:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div>
            <MeetingSummary
                summary={summary}
                videoId={videoId}
                onGenerateSummary={handleGenerateSummary}
                isGenerating={isGenerating}
            />
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    Error: {error}
                </div>
            )}
        </div>
    );
}
