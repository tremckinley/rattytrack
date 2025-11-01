// YouTube Data API integration for fetching Memphis City Council videos

/**
 * Parse ISO 8601 duration string (e.g., "PT1H2M34S") to seconds
 */
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  duration: number; // Duration in seconds
}

/**
 * Fetch the latest videos from a YouTube channel
 * Uses the channel's uploads playlist for efficient API usage (1 quota unit vs 100 for search)
 */
export async function getChannelVideos(
  channelHandle: string,
  maxResults: number = 5
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    // Step 1: Get channel ID from handle
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${channelHandle}&key=${apiKey}`
    );

    if (!channelResponse.ok) {
      throw new Error(`Failed to fetch channel: ${channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error(`Channel not found: ${channelHandle}`);
    }

    // Step 2: Get the uploads playlist ID
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Step 3: Fetch videos from the uploads playlist
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`
    );

    if (!playlistResponse.ok) {
      throw new Error(`Failed to fetch playlist: ${playlistResponse.statusText}`);
    }

    const playlistData = await playlistResponse.json();
    
    // Step 4: Get video IDs to fetch duration and other details
    const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
    
    // Step 5: Fetch video details including duration
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
    );
    
    if (!videosResponse.ok) {
      throw new Error(`Failed to fetch video details: ${videosResponse.statusText}`);
    }
    
    const videosData = await videosResponse.json();

    // Step 6: Transform the data and parse durations
    const videos: YouTubeVideo[] = videosData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      duration: parseISO8601Duration(item.contentDetails.duration),
    }));

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}

/**
 * Get Memphis City Council's latest videos
 */
export async function getMemphisCityCouncilVideos(maxResults: number = 5): Promise<YouTubeVideo[]> {
  return getChannelVideos('MemphisCityCouncil', maxResults);
}
