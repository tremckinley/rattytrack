// YouTube Data API v3 client for fetching channel videos

import { YouTubeVideo } from '@/lib/types/youtube';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_HANDLE = '@MemphisCityCouncil';

interface YouTubeSearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      thumbnails: {
        high: { url: string };
      };
      description: string;
    };
  }>;
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    contentDetails: {
      duration: string; // ISO 8601 format (PT1H2M3S)
    };
  }>;
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT1H2M3S = 3723 seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get channel ID from channel handle
 */
async function getChannelId(handle: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
    );

    const data = await response.json();
    return data.items?.[0]?.id?.channelId || null;
  } catch (error) {
    console.error('Error fetching channel ID:', error);
    return null;
  }
}

/**
 * Fetch latest videos from Memphis City Council channel
 */
export async function fetchLatestVideos(maxResults: number = 5): Promise<YouTubeVideo[]> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  try {
    // Get channel ID first
    const channelId = await getChannelId(CHANNEL_HANDLE);
    if (!channelId) {
      throw new Error('Could not find Memphis City Council channel');
    }

    // Fetch latest videos
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.json();
      throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json();
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Fetch video details (including duration)
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch video details');
    }

    const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json();

    // Combine search results with video details
    const videos: YouTubeVideo[] = searchData.items.map((item, index) => {
      const details = detailsData.items.find(d => d.id === item.id.videoId);
      const duration = details ? parseDuration(details.contentDetails.duration) : 0;

      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        duration: duration.toString(),
        thumbnailUrl: item.snippet.thumbnails.high.url,
        description: item.snippet.description,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    });

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}

/**
 * Get single video details
 */
export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const item = data.items?.[0];

    if (!item) return null;

    return {
      videoId: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      duration: parseDuration(item.contentDetails.duration).toString(),
      thumbnailUrl: item.snippet.thumbnails.high.url,
      description: item.snippet.description,
      url: `https://www.youtube.com/watch?v=${item.id}`,
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}