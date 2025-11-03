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

export type TranscriptionStatus = 'idle' | 'downloading' | 'transcribing' | 'completed' | 'error';
