/**
 * Download URL with quality
 */
export interface DownloadUrl {
  quality: string;
  url: string;
}

/**
 * Track interface - transformed from Spotify API response
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumArt: string;
  duration: number;
  previewUrl: string | null;
  downloadUrls: DownloadUrl[];
  spotifyUrl: string;
}

/**
 * Spotify API response types (raw)
 */
export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbumImage {
  url: string;
  width: number;
  height: number;
}

export interface SpotifyAlbum {
  name: string;
  images: SpotifyAlbumImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * API Response types
 */
export interface SearchResponse {
  tracks: Track[];
  query: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

/**
 * Transform Spotify API track to our Track interface
 */
export function spotifyTrackToTrack(spotifyTrack: SpotifyTrack): Track {
  const primaryArtist = spotifyTrack.artists[0];
  const albumImage = spotifyTrack.album.images.find(img => img.width === 300) 
    || spotifyTrack.album.images[0];

  return {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: primaryArtist?.name || 'Unknown Artist',
    artistId: primaryArtist?.id || '',
    album: spotifyTrack.album.name,
    albumArt: albumImage?.url || '',
    duration: spotifyTrack.duration_ms,
    previewUrl: spotifyTrack.preview_url,
    downloadUrls: [],
    spotifyUrl: spotifyTrack.external_urls.spotify
  };
}
