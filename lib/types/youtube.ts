export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  viewCount?: string;
  channelId: string;
  channelTitle: string;
  url: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface VideoTranscript {
  videoId: string;
  segments: TranscriptSegment[];
  language?: string;
}

export type TranscriptionStatus = 'idle' | 'processing' | 'downloading' | 'transcribing' | 'completed' | 'error';

export interface YouTubeTranscription {
  video_id: string;
  title: string;
  channel_title: string;
  published_at: string;
  duration: number;
  thumbnail_url: string;
  status: TranscriptionStatus;
  error_message?: string;
  transcription_cost?: number;
  created_at: string;
  updated_at: string;
}
