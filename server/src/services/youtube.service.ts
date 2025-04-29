import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error('YOUTUBE_API_KEY is not set in environment variables');
}

class YouTubeService {
  private static instance: YouTubeService;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  private constructor() {}

  public static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  async searchVideos(query: string, maxResults: number = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query,
          maxResults,
          type: 'video',
          key: YOUTUBE_API_KEY,
        },
      });

      return response.data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
      }));
    } catch (error) {
      console.error('Error searching YouTube:', error);
      throw error;
    }
  }

  async getVideoDetails(videoId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          part: 'snippet,contentDetails',
          id: videoId,
          key: YOUTUBE_API_KEY,
        },
      });

      if (response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.default.url,
        duration: video.contentDetails.duration,
        channelTitle: video.snippet.channelTitle,
      };
    } catch (error) {
      console.error('Error getting video details:', error);
      throw error;
    }
  }
}

export default YouTubeService.getInstance(); 