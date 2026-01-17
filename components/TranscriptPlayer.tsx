'use client';

// Interactive transcript player with video embed
// Allows clicking timestamps to jump to specific times

import { useState, useRef, useEffect, useMemo } from 'react';
import { TranscriptSegment } from '@/lib/types/youtube';

interface TranscriptPlayerProps {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  segments: TranscriptSegment[];
  legislatorMap?: Record<string, { display_name: string }>;
}

// Opening section types that should be condensed
type OpeningSection = 'call_to_order' | 'invocation' | 'pledge' | null;

interface CondensedSection {
  type: 'condensed';
  sectionName: string;
  startTime: number;
  endTime: number;
}

interface FullSegment {
  type: 'full';
  segment: TranscriptSegment;
}

type DisplayItem = CondensedSection | FullSegment;

/**
 * Detect which opening section a segment belongs to based on its text
 */
function detectOpeningSection(text: string): OpeningSection {
  const lowerText = text.toLowerCase();

  // Call to Order detection
  if (lowerText.includes('call to order') ||
    lowerText.includes('meeting to order') ||
    lowerText.includes('come to order') ||
    lowerText.includes('call this meeting')) {
    return 'call_to_order';
  }

  // Invocation detection
  if (lowerText.includes('invocation') ||
    lowerText.includes('prayer') ||
    lowerText.includes('heavenly father') ||
    lowerText.includes('dear lord') ||
    lowerText.includes('amen') ||
    lowerText.includes('bow our heads') ||
    lowerText.includes('let us pray')) {
    return 'invocation';
  }

  // Pledge detection
  if (lowerText.includes('pledge of allegiance') ||
    lowerText.includes('pledge allegiance') ||
    lowerText.includes('i pledge allegiance') ||
    lowerText.includes('the flag') ||
    lowerText.includes('republic for which it stands') ||
    lowerText.includes('one nation') ||
    lowerText.includes('liberty and justice')) {
    return 'pledge';
  }

  return null;
}

/**
 * Check if a segment indicates the roll call has started
 */
function isRollCallStart(text: string): boolean {
  const lowerText = text.toLowerCase();
  return lowerText.includes('roll call') ||
    lowerText.includes('call the roll') ||
    lowerText.includes('call of roll') ||
    lowerText.includes('calling the roll') ||
    lowerText.includes('roll, please');
}

/**
 * Process segments to condense opening sections
 */
function processSegmentsForDisplay(segments: TranscriptSegment[]): DisplayItem[] {
  const displayItems: DisplayItem[] = [];
  let rollCallFound = false;
  let currentOpeningSection: OpeningSection = null;
  let sectionStart: number | null = null;
  let sectionEnd: number = 0;

  const sectionNames: Record<string, string> = {
    'call_to_order': 'Call to Order',
    'invocation': 'Invocation',
    'pledge': 'Pledge of Allegiance',
  };

  // First pass: find where roll call starts
  let rollCallIndex = -1;
  for (let i = 0; i < segments.length; i++) {
    if (isRollCallStart(segments[i].text)) {
      rollCallIndex = i;
      break;
    }
  }

  // If no roll call found, check first ~5 minutes for opening sections only
  const maxOpeningTime = rollCallIndex === -1 ? 300 : segments[rollCallIndex]?.start_time || 300;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Once we're past the opening sections, show everything
    if (segment.start_time >= maxOpeningTime || (rollCallIndex !== -1 && i >= rollCallIndex)) {
      // Finalize any pending condensed section
      if (currentOpeningSection && sectionStart !== null) {
        displayItems.push({
          type: 'condensed',
          sectionName: sectionNames[currentOpeningSection],
          startTime: sectionStart,
          endTime: sectionEnd,
        });
        currentOpeningSection = null;
        sectionStart = null;
      }

      // Add roll call marker if this is where it starts
      if (i === rollCallIndex && !rollCallFound) {
        rollCallFound = true;
        displayItems.push({
          type: 'condensed',
          sectionName: 'Roll Call',
          startTime: segment.start_time,
          endTime: segment.end_time,
        });
        continue; // Skip the actual roll call segment text
      }

      // Add full segment
      displayItems.push({ type: 'full', segment });
      continue;
    }

    // During opening period, detect sections
    const detectedSection = detectOpeningSection(segment.text);

    if (detectedSection) {
      if (currentOpeningSection !== detectedSection) {
        // Finalize previous section if exists
        if (currentOpeningSection && sectionStart !== null) {
          displayItems.push({
            type: 'condensed',
            sectionName: sectionNames[currentOpeningSection],
            startTime: sectionStart,
            endTime: sectionEnd,
          });
        }
        // Start new section
        currentOpeningSection = detectedSection;
        sectionStart = segment.start_time;
      }
      sectionEnd = segment.end_time;
    } else if (currentOpeningSection) {
      // Continue current section even without keywords (e.g., middle of prayer)
      sectionEnd = segment.end_time;
    } else {
      // No section detected in opening period, show anyway
      displayItems.push({ type: 'full', segment });
    }
  }

  // Finalize any remaining section
  if (currentOpeningSection && sectionStart !== null) {
    displayItems.push({
      type: 'condensed',
      sectionName: sectionNames[currentOpeningSection],
      startTime: sectionStart,
      endTime: sectionEnd,
    });
  }

  return displayItems;
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

  // Process segments to condense opening sections
  const displayItems = useMemo(() => processSegmentsForDisplay(segments), [segments]);

  // Filter segments based on search query (only applies to full segments)
  const filteredItems = useMemo(() => {
    if (!searchQuery) return displayItems;
    return displayItems.filter((item) => {
      if (item.type === 'condensed') {
        return item.sectionName.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return item.segment.text.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [displayItems, searchQuery]);

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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Video Player */}
        <div className="h-fit p-0 overflow-hidden flex items-start border border-foreground lg:col-span-2">
          <div className="aspect-video w-full">
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
            <div className="bg-white shadow-md p-6">

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
        </div>

        {/* Transcript */}
        <div className="block p-2 overflow-hidden flex flex-col lg:col-span-3">
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
                Found {filteredItems.length} of {displayItems.length} items
              </p>
            )}
          </div>

          {/* Transcript Segments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px]">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                // Condensed section (Call to Order, Invocation, etc.)
                if (item.type === 'condensed') {
                  return (
                    <div
                      key={`condensed-${index}`}
                      className="group cursor-pointer p-3 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 border border-gray-200"
                      onClick={() => handleTimestampClick(item.startTime)}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          className="font-mono text-sm px-2 py-1 rounded bg-gray-300 text-gray-700 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                        >
                          {formatTimestamp(item.startTime)}
                        </button>
                        <span className="font-medium text-gray-700 italic">
                          {item.sectionName}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Full segment
                const segment = item.segment;
                return (
                  <div
                    key={segment.id}
                    className={`group cursor-pointer p-3 rounded-lg transition-colors ${isActiveSegment(segment)
                      ? 'bg-blue-50 border border-blue-200 segment-active'
                      : 'hover:bg-gray-50'
                      }`}
                    onClick={() => handleTimestampClick(segment.start_time)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          className={`font-mono text-sm px-2 py-1 rounded transition-colors ${isActiveSegment(segment)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 group-hover:bg-blue-600 group-hover:text-white'
                            }`}
                        >
                          {formatTimestamp(segment.start_time)}
                        </button>
                        {segment.speaker_name && (
                          <span
                            className={`text-xs px-2 py-1 font-medium overflow-hidden text-ellipsis ${isActiveSegment(segment)
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                              }`}
                            style={{ maxWidth: '100px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {segment.speaker_id && legislatorMap[segment.speaker_id]
                              ? legislatorMap[segment.speaker_id].display_name
                              : segment.speaker_name}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm leading-relaxed ${isActiveSegment(segment) ? 'text-gray-900 font-medium' : 'text-gray-700'
                          }`}
                      >
                        {searchQuery ? (
                          // Highlight search terms
                          segment.text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part: string, i: number) =>
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
                );
              })
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
    </div>
  );
}