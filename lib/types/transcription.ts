export interface TranscriptSegment {
  id: number;  // bigint primary key from transcription_segments (NOT a UUID)
  video_id: string;
  start_time: number;
  end_time: number;
  text: string;
  speaker_name?: string | null;
  speaker_id?: string | null;
  sentiment?: any | null;
  created_at: string;
}

export interface VideoTranscript {
  videoId: string;
  segments: TranscriptSegment[];
  language?: string;
}

export type TranscriptionStatus = 'idle' | 'queued' | 'processing' | 'downloading' | 'transcribing' | 'completed' | 'error' | 'failed';

export type TranscriptionProvider = 'whisper' | 'elevenlabs' | 'assemblyai';

export interface MeetingTranscription {
  video_id: string;
  title: string;
  channel_title?: string;
  published_at?: string;
  duration?: number;
  thumbnail_url?: string;
  status: TranscriptionStatus;
  error_message?: string;
  transcription_cost?: number;
  provider?: TranscriptionProvider | null;
  diarization_enabled?: boolean | null;
  created_at: string;
  updated_at: string;
}
