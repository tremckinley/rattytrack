'use client';

// Component for mapping speaker labels to actual legislators
// Allows manual speaker identification after diarization
// Enhanced with AI suggestions from learned patterns

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faUserTie, faLightbulb, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

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
  source: 'learned_pattern' | 'text_analysis' | 'name_match';
}

interface SpeakerMapperProps {
  videoId: string;
  speakerLabels: SpeakerLabel[];
  legislators: Legislator[];
  onMappingComplete: () => void;
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
  const [speakerStats, setSpeakerStats] = useState<Record<string, { sampleText: string; totalDuration: number }>>({});

  // Fetch suggestions on mount
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch(`/api/transcripts/suggest-speakers?videoId=${videoId}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || {});

          // Extract sample text from speaker stats
          const stats: Record<string, { sampleText: string; totalDuration: number }> = {};
          data.speakerStats?.forEach((stat: { label: string; sampleText: string; totalDuration: number }) => {
            stats[stat.label] = {
              sampleText: stat.sampleText,
              totalDuration: stat.totalDuration,
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
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-500 bg-gray-50';
  };

  const hasSuggestions = Object.keys(suggestions).length > 0;
  const highConfidenceSuggestions = Object.entries(suggestions).filter(
    ([label, s]) => s.confidence >= 0.6 && !mappings[label]
  );

  return (
    <div className="block border-t-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
            className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            Apply {highConfidenceSuggestions.length} Suggestion{highConfidenceSuggestions.length > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {loadingSuggestions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            Loading AI suggestions...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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

          return (
            <div
              key={speaker.label}
              className="sub-block border border-gray-200 p-3"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-28">
                  <div className="text-sm font-medium text-gray-900">{speaker.label}</div>
                  <div className="text-xs text-gray-500">
                    {speaker.segmentCount} segment{speaker.segmentCount !== 1 ? 's' : ''}
                    {stats?.totalDuration && ` · ${Math.round(stats.totalDuration / 60)}min`}
                  </div>
                </div>

                <div className="flex-1">
                  <select
                    value={mappings[speaker.label] || ''}
                    onChange={(e) => handleMappingChange(speaker.label, e.target.value)}
                    className="w-full px-3 py-2 border border-foreground focus:ring-2 focus:ring-capyred focus:border-transparent focus:rounded-none"
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
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Suggestion Row */}
              {showSuggestion && (
                <div className="mt-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faLightbulb} className="text-amber-500 text-sm" />
                  <span className="text-xs text-gray-600">Suggestion:</span>
                  <button
                    onClick={() => applySuggestion(speaker.label)}
                    className={`text-xs px-2 py-1 rounded ${getConfidenceColor(suggestion.confidence)}`}
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
              {stats?.sampleText && (
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
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${saving || !hasChanges()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
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
