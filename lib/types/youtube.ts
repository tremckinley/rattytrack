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
  id: number;
  video_id: string;
  start_time: number;
  end_time: number;
  text: string;
  created_at: string;
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
