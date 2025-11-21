'use client';

// Component for mapping speaker labels to actual legislators
// Allows manual speaker identification after diarization

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faSpinner, faUserTie } from '@fortawesome/free-solid-svg-icons';

interface SpeakerLabel {
  label: string;
  segmentCount: number;
  legislatorId: string | null;
}

interface Legislator {
  id: string;
  display_name: string;
  title: string | null;
  district: string | null;
  photo_url: string | null;
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
    // Initialize with existing mappings
    const initial: Record<string, string | null> = {};
    speakerLabels.forEach(speaker => {
      initial[speaker.label] = speaker.legislatorId;
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMappingChange = (speakerLabel: string, legislatorId: string) => {
    setMappings(prev => ({
      ...prev,
      [speakerLabel]: legislatorId === '' ? null : legislatorId,
    }));
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faUserTie} className="text-blue-600" />
            Map Speakers to Legislators
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Assign each detected speaker to the corresponding legislator
          </p>
        </div>
      </div>

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
          
          return (
            <div
              key={speaker.label}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-shrink-0 w-32">
                <div className="text-sm font-medium text-gray-900">{speaker.label}</div>
                <div className="text-xs text-gray-500">
                  {speaker.segmentCount} segment{speaker.segmentCount !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="flex-1">
                <select
                  value={mappings[speaker.label] || ''}
                  onChange={(e) => handleMappingChange(speaker.label, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges()}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            saving || !hasChanges()
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
