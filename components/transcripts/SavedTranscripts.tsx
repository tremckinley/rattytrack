'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileVideo, faCalendar, faClock, faSearch } from '@fortawesome/free-solid-svg-icons';
import type { UploadedMeeting } from '@/types/UploadedMeeting';

type SavedTranscriptsProps = {
  meetings: UploadedMeeting[];
};

export default function SavedTranscripts({ meetings }: SavedTranscriptsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      meeting.title?.toLowerCase().includes(query) ||
      meeting.full_transcript?.toLowerCase().includes(query) ||
      meeting.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Saved Transcripts</h2>
      
      {meetings.length === 0 ? (
        <div className="card p-8 text-center bg-card border border-border">
          <FontAwesomeIcon icon={faFileVideo} className="text-4xl text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No transcripts saved yet. Upload a video to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transcripts match your search.
              </p>
            ) : (
              filteredMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="card p-4 bg-white border border-foreground hover:border-foreground hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                >
                  <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-capyred transition-colors">
                    {meeting.title || 'Untitled Meeting'}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCalendar} />
                      <span>{formatDate(meeting.uploaded_at)}</span>
                    </div>
                    {meeting.video_duration_seconds && (
                      <div className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faClock} />
                        <span>{formatDuration(meeting.video_duration_seconds)}</span>
                      </div>
                    )}
                    {meeting.video_language && (
                      <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {meeting.video_language.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {meeting.full_transcript && (
                    <p className="text-sm text-foreground/80 line-clamp-2">
                      {meeting.full_transcript}
                    </p>
                  )}

                  {meeting.description && (
                    <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
                      {meeting.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
