import axios from 'axios';
import { Track } from '../../shared/types';

const JIOSAAVN_API = process.env.JIOSAAVN_API_URL || 'https://spotify-ivory-one.vercel.app';

interface JioSaavnArtist {
  id: string;
  name: string;
  url: string;
  image: { url: string }[];
}

interface JioSaavnSong {
  id: string;
  name: string;
  type: string;
  year: string;
  duration: number;
  label: string;
  album: {
    id: string;
    name: string;
    url: string;
  };
  artists: {
    primary: JioSaavnArtist[];
    featured: JioSaavnArtist[];
    all: JioSaavnArtist[];
  };
  image: { url: string; quality: string }[];
  downloadUrl: { url: string; quality: string }[];
  url: string;
}

interface JioSaavnSearchResponse {
  success: boolean;
  data: {
    total: number;
    start: number;
    results: JioSaavnSong[];
  };
}

interface JioSaavnLyricsResponse {
  success: boolean;
  data: {
    lyrics: string;
    snippet: string;
    copyright: string;
  };
}

/**
 * Transform JioSaavn song to our Track interface
 */
function jiosaavnToTrack(song: JioSaavnSong): Track {
  const primaryArtist = song.artists?.primary?.[0];
  // Get highest quality image (500x500)
  const albumArt = song.image?.find(img => img.quality === '500x500')?.url 
    || song.image?.[song.image.length - 1]?.url || '';
  // Get highest quality audio (320kbps)
  const audioUrl = song.downloadUrl?.find(dl => dl.quality === '320kbps')?.url
    || song.downloadUrl?.[song.downloadUrl.length - 1]?.url || null;

  return {
    id: song.id,
    title: song.name,
    artist: primaryArtist?.name || 'Unknown Artist',
    artistId: primaryArtist?.id || '',
    album: song.album?.name || '',
    albumArt,
    duration: song.duration * 1000, // Convert to milliseconds
    previewUrl: audioUrl, // Full song URL!
    spotifyUrl: song.url || ''
  };
}


/**
 * JioSaavn Service - Search and stream full songs
 */
export class JioSaavnService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = JIOSAAVN_API;
  }

  /**
   * Search for songs
   */
  async searchTracks(query: string, limit: number = 20): Promise<Track[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const response = await axios.get<JioSaavnSearchResponse>(
        `${this.baseUrl}/api/search/songs`,
        {
          params: {
            query,
            limit
          }
        }
      );

      if (!response.data.success || !response.data.data?.results) {
        return [];
      }

      return response.data.data.results.map(jiosaavnToTrack);
    } catch (error) {
      console.error('JioSaavn search error:', error);
      throw new Error('Failed to search songs');
    }
  }

  /**
   * Get lyrics for a song
   */
  async getLyrics(songId: string): Promise<{ lyrics: string; copyright: string } | null> {
    try {
      const response = await axios.get<JioSaavnLyricsResponse>(
        `${this.baseUrl}/api/songs/${songId}/lyrics`
      );

      if (!response.data.success || !response.data.data?.lyrics) {
        return null;
      }

      return {
        lyrics: response.data.data.lyrics,
        copyright: response.data.data.copyright || ''
      };
    } catch (error) {
      console.error('JioSaavn lyrics error:', error);
      return null;
    }
  }

  /**
   * Get download URLs for a song
   */
  async getDownloadUrls(songId: string): Promise<{ quality: string; url: string }[] | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/songs/${songId}`
      );

      if (!response.data.success || !response.data.data?.[0]?.downloadUrl) {
        return null;
      }

      return response.data.data[0].downloadUrl;
    } catch (error) {
      console.error('JioSaavn download error:', error);
      return null;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/search/songs`, {
        params: { query: 'test', limit: 1 }
      });
      return response.data.success === true;
    } catch {
      return false;
    }
  }
}

export const jiosaavnService = new JioSaavnService();
