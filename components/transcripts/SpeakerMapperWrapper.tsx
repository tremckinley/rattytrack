'use client';

// Wrapper component for SpeakerMapper with collapsible UI
// Handles showing/hiding the speaker mapping panel

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faUserCheck, faUserTag } from '@fortawesome/free-solid-svg-icons';
import SpeakerMapper from './SpeakerMapper';

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

interface SpeakerMapperWrapperProps {
  videoId: string;
  speakerLabels: SpeakerLabel[];
  legislators: Legislator[];
}

export default function SpeakerMapperWrapper({
  videoId,
  speakerLabels,
  legislators,
}: SpeakerMapperWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMappingComplete = () => {
    // Reload the page to show updated speaker names
    window.location.reload();
  };

  if (speakerLabels.length === 0) {
    return null;
  }

  const unmappedCount = speakerLabels.filter(s => !s.legislatorId).length;

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={isExpanded ? "block flex items-center justify-between hover:bg-gray-50 transition-colors border-b-0" : "block flex items-center justify-between hover:bg-gray-50 transition-colors"}
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">
              Speaker Identification
            </h3>
            <p className="text-sm text-gray-600">
              {unmappedCount > 0 ? (
                <>
                <FontAwesomeIcon icon={faUserTag} className="text-green-600" /> 
                  {unmappedCount} of {speakerLabels.length} speaker
                  {speakerLabels.length !== 1 ? 's' : ''} not yet identified
                </>
              ) : (
                <> <FontAwesomeIcon icon={faUserCheck} className="text-green-600" /> All {speakerLabels.length} speakers identified</>
              )}
            </p>
          </div>
          {unmappedCount > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded">
              Action Required
            </span>
          )}
        </div>
        <FontAwesomeIcon
          icon={isExpanded ? faChevronUp : faChevronDown}
          className="text-gray-400"
        />
      </button>

      {isExpanded && (
        <div className="">
          <SpeakerMapper
            videoId={videoId}
            speakerLabels={speakerLabels}
            legislators={legislators}
            onMappingComplete={handleMappingComplete}
          />
        </div>
      )}
    </div>
  );
}
