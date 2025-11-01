// YouTube Data API integration for fetching Memphis City Council videos

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
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

    // Step 4: Transform the data
    const videos: YouTubeVideo[] = playlistData.items.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
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
