'use client';

// Component for mapping speaker labels to actual legislators
// Allows manual speaker identification after diarization
// Enhanced with AI suggestions from learned patterns
// Sprint 9: Added audio snippet preview timestamps and contextual address indicators

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faUserTie, faLightbulb, faWandMagicSparkles, faPlay, faClock } from '@fortawesome/free-solid-svg-icons';

interface SpeakerLabel {
  label: string;
  segmentCount: number;
  legislatorId: string | null;
  sampleText?: string;
}

interface Legislator {
  id: string;
  display_name: string;
  title: string | null;
  district: string | null;
  photo_url: string | null;
}

interface SpeakerSuggestion {
  legislatorId: string | null;
  legislatorName: string | null;
  confidence: number;
  reason: string;
  source: 'learned_pattern' | 'text_analysis' | 'name_match' | 'contextual_address' | 'llm_inference';
}

interface TimestampSample {
  startTime: number;
  text: string;
  duration: number;
}

interface SpeakerMapperProps {
  videoId: string;
  speakerLabels: SpeakerLabel[];
  legislators: Legislator[];
  onMappingComplete: () => void;
}

/**
 * Format seconds to readable timestamp
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
 * Get a human-readable badge for the suggestion source
 */
function getSourceBadge(source: SpeakerSuggestion['source']): { label: string; className: string } {
  switch (source) {
    case 'learned_pattern':
      return { label: 'LEARNED', className: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'contextual_address':
      return { label: 'CONTEXT', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'llm_inference':
      return { label: 'AI', className: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'text_analysis':
      return { label: 'TEXT', className: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'name_match':
      return { label: 'NAME', className: 'bg-gray-100 text-gray-800 border-gray-300' };
    default:
      return { label: 'AUTO', className: 'bg-gray-100 text-gray-600 border-gray-300' };
  }
}

export default function SpeakerMapper({
  videoId,
  speakerLabels,
  legislators,
  onMappingComplete,
}: SpeakerMapperProps) {
  const [mappings, setMappings] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    speakerLabels.forEach(speaker => {
      initial[speaker.label] = speaker.legislatorId;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, SpeakerSuggestion>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [speakerStats, setSpeakerStats] = useState<Record<string, {
    sampleText: string;
    totalDuration: number;
    timestampSamples: TimestampSample[];
  }>>({});
  const [expandedSpeaker, setExpandedSpeaker] = useState<string | null>(null);

  // Fetch suggestions on mount
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch(`/api/transcripts/suggest-speakers?videoId=${videoId}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || {});

          // Extract sample text and timestamp samples from speaker stats
          const stats: Record<string, {
            sampleText: string;
            totalDuration: number;
            timestampSamples: TimestampSample[];
          }> = {};
          data.speakerStats?.forEach((stat: {
            label: string;
            sampleText: string;
            totalDuration: number;
            timestampSamples?: TimestampSample[];
          }) => {
            stats[stat.label] = {
              sampleText: stat.sampleText,
              totalDuration: stat.totalDuration,
              timestampSamples: stat.timestampSamples || [],
            };
          });
          setSpeakerStats(stats);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }

    fetchSuggestions();
  }, [videoId]);

  const handleMappingChange = (speakerLabel: string, legislatorId: string) => {
    setMappings(prev => ({
      ...prev,
      [speakerLabel]: legislatorId === '' ? null : legislatorId,
    }));
    setSuccess(false);
    setError(null);
  };

  const applySuggestion = (speakerLabel: string) => {
    const suggestion = suggestions[speakerLabel];
    if (suggestion?.legislatorId) {
      handleMappingChange(speakerLabel, suggestion.legislatorId);
    }
  };

  const applyAllSuggestions = () => {
    const newMappings = { ...mappings };
    Object.entries(suggestions).forEach(([label, suggestion]) => {
      if (suggestion.legislatorId && suggestion.confidence >= 0.6 && !mappings[label]) {
        newMappings[label] = suggestion.legislatorId;
      }
    });
    setMappings(newMappings);
    setSuccess(false);
    setError(null);
  };

  /**
   * Scroll to the transcript player and jump to a specific timestamp.
   * Since Granicus embeds don't support URL-based seeking, we dispatch
   * a custom event that the TranscriptPlayer can listen for.
   */
  const handleListenClick = (startTime: number) => {
    // Dispatch a custom event for the TranscriptPlayer to pick up
    window.dispatchEvent(new CustomEvent('seekToTimestamp', { detail: { time: startTime } }));

    // Also scroll the page to the video player
    const playerFrame = document.querySelector('iframe');
    if (playerFrame) {
      playerFrame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update each speaker mapping
      for (const [speakerLabel, legislatorId] of Object.entries(mappings)) {
        const response = await fetch('/api/transcripts/map-speaker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            speakerLabel,
            legislatorId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save mapping');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onMappingComplete();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return speakerLabels.some(speaker => {
      return mappings[speaker.label] !== speaker.legislatorId;
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-800 bg-green-50 border-green-300';
    if (confidence >= 0.6) return 'text-yellow-800 bg-yellow-50 border-yellow-300';
    return 'text-gray-600 bg-gray-50 border-gray-300';
  };

  const hasSuggestions = Object.keys(suggestions).length > 0;
  const highConfidenceSuggestions = Object.entries(suggestions).filter(
    ([label, s]) => s.confidence >= 0.6 && !mappings[label]
  );

  return (
    <div className="block border-t-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faUserTie} className="text-capyred" />
            Map Speakers to Legislators
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Assign each detected speaker to the corresponding legislator
          </p>
        </div>

        {/* Apply All Suggestions Button */}
        {highConfidenceSuggestions.length > 0 && (
          <button
            onClick={applyAllSuggestions}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200 transition-colors font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            Apply {highConfidenceSuggestions.length} Suggestion{highConfidenceSuggestions.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {loadingSuggestions && (
        <div className="bg-blue-50 border border-foreground p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            Loading AI suggestions...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-foreground p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-foreground p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faCheck} />
            Mappings saved successfully!
          </p>
        </div>
      )}

      <div className="space-y-3">
        {speakerLabels.map(speaker => {
          const selectedLegislator = legislators.find(l => l.id === mappings[speaker.label]);
          const suggestion = suggestions[speaker.label];
          const stats = speakerStats[speaker.label];
          const showSuggestion = suggestion && !mappings[speaker.label] && suggestion.confidence >= 0.5;
          const isExpanded = expandedSpeaker === speaker.label;

          return (
            <div
              key={speaker.label}
              className="border border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-32">
                  <div className="text-sm font-bold text-foreground uppercase tracking-wider">{speaker.label}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {speaker.segmentCount} segment{speaker.segmentCount !== 1 ? 's' : ''}
                    {stats?.totalDuration && ` · ${Math.round(stats.totalDuration / 60)}min`}
                  </div>
                  {/* Listen toggle */}
                  {stats?.timestampSamples && stats.timestampSamples.length > 0 && (
                    <button
                      onClick={() => setExpandedSpeaker(isExpanded ? null : speaker.label)}
                      className="mt-2 text-xs font-bold text-capyred flex items-center gap-1 hover:text-rose-900 transition-colors"
                    >
                      <FontAwesomeIcon icon={faPlay} className="text-[10px]" />
                      {isExpanded ? 'Hide Samples' : 'Listen'}
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <select
                    value={mappings[speaker.label] || ''}
                    onChange={(e) => handleMappingChange(speaker.label, e.target.value)}
                    className="w-full px-3 py-2 border border-foreground focus:ring-2 focus:ring-capyred focus:border-transparent bg-white"
                  >
                    <option value="">Unassigned</option>
                    {legislators.map(legislator => (
                      <option key={legislator.id} value={legislator.id}>
                        {legislator.display_name}
                        {legislator.title && ` - ${legislator.title}`}
                        {legislator.district && ` (${legislator.district})`}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLegislator && selectedLegislator.photo_url && (
                  <div className="flex-shrink-0">
                    <img
                      src={selectedLegislator.photo_url}
                      alt={selectedLegislator.display_name}
                      className="w-10 h-10 object-cover border border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                    />
                  </div>
                )}
              </div>

              {/* Audio Snippet Preview (Task 9.3) */}
              {isExpanded && stats?.timestampSamples && (
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    Sample Segments (longest)
                  </div>
                  {stats.timestampSamples.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleListenClick(sample.startTime)}
                      className="w-full text-left flex items-start gap-3 p-2 border border-gray-200 hover:border-capyred hover:bg-rose-50 transition-all group"
                    >
                      <span className="font-mono text-xs bg-capyred text-white px-2 py-1 font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border border-foreground flex-shrink-0 group-hover:bg-rose-900 transition-colors">
                        ▶ {formatTimestamp(sample.startTime)}
                      </span>
                      <span className="text-xs text-gray-600 leading-relaxed italic truncate">
                        &ldquo;{sample.text}&rdquo;
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {Math.round(sample.duration)}s
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestion Row */}
              {showSuggestion && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 flex-wrap">
                  <FontAwesomeIcon icon={faLightbulb} className="text-amber-500 text-sm" />
                  <span className="text-xs text-gray-600">Suggestion:</span>
                  {/* Source badge */}
                  {(() => {
                    const badge = getSourceBadge(suggestion.source);
                    return (
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${badge.className}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                  <button
                    onClick={() => applySuggestion(speaker.label)}
                    className={`text-xs px-2 py-1 border font-bold ${getConfidenceColor(suggestion.confidence)} hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all`}
                  >
                    {suggestion.legislatorName}
                    <span className="ml-1 opacity-70">
                      ({Math.round(suggestion.confidence * 100)}%)
                    </span>
                  </button>
                  <span className="text-xs text-gray-400 italic">
                    {suggestion.reason}
                  </span>
                </div>
              )}

              {/* Sample Text */}
              {!isExpanded && stats?.sampleText && (
                <div className="mt-2 text-xs text-gray-400 italic truncate">
                  &ldquo;{stats.sampleText.substring(0, 120)}...&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          className={`px-6 py-2 font-bold transition-colors border border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${saving || !hasChanges()
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-capyred text-white hover:bg-rose-900'
            }`}
        >
          {saving ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Mappings'
          )}
        </button>
      </div>
    </div>
  );
}
