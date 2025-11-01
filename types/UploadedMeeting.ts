export type UploadedMeeting = {
  id: string;
  title: string | null;
  description: string | null;
  video_filename: string | null; // Nullable for YouTube videos
  video_size_bytes: number | null; // Nullable for YouTube videos
  video_duration_seconds: number | null;
  video_language: string | null;
  youtube_video_id: string | null; // YouTube video ID (e.g., 'dQw4w9WgXcQ')
  full_transcript: string | null;
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
  transcription_error: string | null;
  uploaded_at: string;
  processed_at: string | null;
  is_active: boolean;
};

export type UploadedMeetingSegment = {
  id: string;
  uploaded_meeting_id: string;
  segment_index: number;
  start_time_seconds: number;
  end_time_seconds: number;
  text: string;
  speaker_name: string | null;
  speaker_id: string | null;
};
