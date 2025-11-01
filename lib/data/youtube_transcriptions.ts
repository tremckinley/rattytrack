// Data access layer for YouTube video transcriptions

import { supabase } from '@/lib/utils/supabase';
import type { UploadedMeeting } from '@/types/UploadedMeeting';

/**
 * Check if a YouTube video has already been transcribed
 */
export async function getYouTubeTranscription(videoId: string): Promise<UploadedMeeting | null> {
  
  const { data, error } = await supabase
    .from('uploaded_meetings')
    .select('*')
    .eq('youtube_video_id', videoId)
    .eq('is_active', true)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - video not transcribed yet
      return null;
    }
    console.error('Error checking transcription:', error);
    throw error;
  }
  
  return data as UploadedMeeting;
}

/**
 * Get all transcribed YouTube videos
 */
export async function getAllYouTubeTranscriptions(): Promise<UploadedMeeting[]> {
  
  const { data, error } = await supabase
    .from('uploaded_meetings')
    .select('*')
    .not('youtube_video_id', 'is', null)
    .eq('is_active', true)
    .order('uploaded_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching transcriptions:', error);
    throw error;
  }
  
  return (data as UploadedMeeting[]) || [];
}

/**
 * Check if multiple YouTube videos are transcribed
 * Returns a map of videoId -> boolean
 */
export async function checkMultipleTranscriptions(videoIds: string[]): Promise<Map<string, boolean>> {
  
  const { data, error } = await supabase
    .from('uploaded_meetings')
    .select('youtube_video_id')
    .in('youtube_video_id', videoIds)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error checking multiple transcriptions:', error);
    return new Map();
  }
  
  const transcribed = new Set(data?.map((d: any) => d.youtube_video_id) || []);
  const result = new Map<string, boolean>();
  
  videoIds.forEach(id => {
    result.set(id, transcribed.has(id));
  });
  
  return result;
}
