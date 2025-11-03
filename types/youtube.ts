// Type definitions for YouTube transcription system

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  duration: number; // Duration in seconds
  thumbnailUrl: string;
  description?: string;
}

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'error';

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

export interface TranscriptSegment {
  id: number;
  video_id: string;
  start_time: number;
  end_time: number;
  text: string;
  created_at: string;
}

export interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

export interface WhisperResponse {
  text: string;
  segments?: WhisperSegment[];
  duration?: number;
  language?: string;
}