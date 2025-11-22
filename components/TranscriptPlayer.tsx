'use client';

// Interactive transcript player with video embed
// Allows clicking timestamps to jump to specific times

import { useState, useRef, useEffect } from 'react';
import { TranscriptSegment } from '@/lib/types/youtube';

interface TranscriptPlayerProps {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  segments: TranscriptSegment[];
  legislatorMap?: Record<string, { display_name: string }>;
}

/**
 * Format timestamp for display (e.g., "1:23:45")
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date to readable format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function TranscriptPlayer({
  videoId,
  title,
  channelTitle,
  publishedAt,
  segments,
  legislatorMap = {},
}: TranscriptPlayerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Filter segments based on search query
  const filteredSegments = segments.filter((segment) =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle timestamp click - update video player
  const handleTimestampClick = (seconds: number) => {
    // Update iframe src to jump to timestamp
    if (iframeRef.current) {
      const newSrc = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(seconds)}&autoplay=1`;
      iframeRef.current.src = newSrc;
    }
    setCurrentTime(seconds);
  };

  // Highlight active segment based on current time
  const isActiveSegment = (segment: TranscriptSegment): boolean => {
    return currentTime >= segment.start_time && currentTime < segment.end_time;
  };

  // Auto-scroll to active segment
  useEffect(() => {
    const activeElement = document.querySelector('.segment-active');
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime]);

  return (
    <div className="space-y-6">
      {/* Video Title */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <div className="flex items-center gap-4 text-gray-600">
          <span>{channelTitle}</span>
          <span>•</span>
          <span>{formatDate(publishedAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="aspect-video">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2">
                Found {filteredSegments.length} of {segments.length} segments
              </p>
            )}
          </div>

          {/* Transcript Segments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px]">
            {filteredSegments.length > 0 ? (
              filteredSegments.map((segment) => (
                <div
                  key={segment.id}
                  className={`group cursor-pointer p-3 rounded-lg transition-colors ${
                    isActiveSegment(segment)
                      ? 'bg-blue-50 border border-blue-200 segment-active'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleTimestampClick(segment.start_time)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        className={`font-mono text-sm px-2 py-1 rounded transition-colors ${
                          isActiveSegment(segment)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 group-hover:bg-blue-600 group-hover:text-white'
                        }`}
                      >
                        {formatTimestamp(segment.start_time)}
                      </button>
                      {segment.speaker_name && (
                        <span
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            isActiveSegment(segment)
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {segment.speaker_id && legislatorMap[segment.speaker_id]
                            ? legislatorMap[segment.speaker_id].display_name
                            : segment.speaker_name}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        isActiveSegment(segment) ? 'text-gray-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {searchQuery ? (
                        // Highlight search terms
                        segment.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <mark key={i} className="bg-yellow-200">
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        )
                      ) : (
                        segment.text
                      )}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                {searchQuery ? (
                  <p>No segments found matching &quot;{searchQuery}&quot;</p>
                ) : (
                  <p>No transcript segments available</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Export Transcript</h3>
        <div className="flex gap-3">
          <button
            onClick={() => {
              const text = segments.map(s => `[${formatTimestamp(s.start_time)}] ${s.text}`).join('\n\n');
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `transcript-${videoId}.txt`;
              a.click();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Download as TXT
          </button>
          <button
            onClick={() => {
              const text = segments.map(s => s.text).join(' ');
              navigator.clipboard.writeText(text);
              alert('Transcript copied to clipboard!');
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}