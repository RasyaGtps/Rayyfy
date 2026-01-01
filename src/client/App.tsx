import React, { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { FiX, FiMusic, FiDownload, FiList, FiGithub } from 'react-icons/fi';
import { Track } from '../shared/types';
import SearchBar from './components/SearchBar';
import TrackList from './components/TrackList';
import AudioPlayer from './components/AudioPlayer';
import Queue from './components/Queue';
import Download from './components/Download';

const JIOSAAVN_API = import.meta.env.VITE_JIOSAAVN_API_URL || 'https://spotify-ivory-one.vercel.app';

interface JioSaavnSong {
  id: string;
  name: string;
  duration: number;
  album: { name: string };
  artists: { primary: { name: string; id: string }[] };
  image: { url: string; quality: string }[];
  downloadUrl: { url: string; quality: string }[];
  url: string;
}

const transformSong = (song: JioSaavnSong): Track => {
  const primaryArtist = song.artists?.primary?.[0];
  const albumArt = song.image?.find(img => img.quality === '500x500')?.url 
    || song.image?.[song.image.length - 1]?.url || '';
  const downloadUrls = song.downloadUrl || [];
  const audioUrl = downloadUrls.find(dl => dl.quality === '320kbps')?.url
    || downloadUrls[downloadUrls.length - 1]?.url || null;

  return {
    id: song.id,
    title: song.name,
    artist: primaryArtist?.name || 'Unknown Artist',
    artistId: primaryArtist?.id || '',
    album: song.album?.name || '',
    albumArt,
    duration: song.duration * 1000,
    previewUrl: audioUrl,
    downloadUrls,
    spotifyUrl: song.url || ''
  };
};

const App: React.FC = () => {
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [downloadTrack, setDownloadTrack] = useState<Track | null>(null);
  const [audioQuality, setAudioQuality] = useState<string>('320kbps');

  const handleDownloadTrack = useCallback((track: Track) => {
    setDownloadTrack(track);
    setIsDownloadOpen(true);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await axios.get(`${JIOSAAVN_API}/api/search/songs`, {
        params: { query, limit: 20 }
      });
      
      if (response.data.success && response.data.data?.results) {
        const tracks = response.data.data.results.map(transformSong);
        setSearchResults(tracks);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      if (err instanceof AxiosError && !err.response) {
        setError('No internet connection.');
      } else {
        setError('Search failed. Please try again.');
      }
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTrackSelect = useCallback((track: Track) => {
    setError(null);
    setCurrentTrack(track);
    setIsPlaying(track.previewUrl !== null);
  }, []);

  const handlePlay = useCallback(() => {
    if (currentTrack?.previewUrl) {
      setError(null);
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const getNextTrack = useCallback(() => {
    if (searchResults.length === 0) return null;
    const playableTracks = searchResults.filter(t => t.previewUrl !== null);
    if (playableTracks.length === 0) return null;

    if (shuffle) {
      const otherTracks = playableTracks.filter(t => t.id !== currentTrack?.id);
      if (otherTracks.length === 0) return playableTracks[0];
      return otherTracks[Math.floor(Math.random() * otherTracks.length)];
    } else {
      const currentPlayableIndex = playableTracks.findIndex(t => t.id === currentTrack?.id);
      const nextIndex = (currentPlayableIndex + 1) % playableTracks.length;
      return playableTracks[nextIndex];
    }
  }, [searchResults, currentTrack, shuffle]);

  const getPreviousTrack = useCallback(() => {
    if (searchResults.length === 0) return null;
    const playableTracks = searchResults.filter(t => t.previewUrl !== null);
    if (playableTracks.length === 0) return null;

    if (shuffle) {
      const otherTracks = playableTracks.filter(t => t.id !== currentTrack?.id);
      if (otherTracks.length === 0) return playableTracks[0];
      return otherTracks[Math.floor(Math.random() * otherTracks.length)];
    } else {
      const currentPlayableIndex = playableTracks.findIndex(t => t.id === currentTrack?.id);
      const prevIndex = currentPlayableIndex <= 0 ? playableTracks.length - 1 : currentPlayableIndex - 1;
      return playableTracks[prevIndex];
    }
  }, [searchResults, currentTrack, shuffle]);

  const handleNext = useCallback(() => {
    const nextTrack = getNextTrack();
    if (nextTrack) {
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    }
  }, [getNextTrack]);

  const handlePrevious = useCallback(() => {
    const prevTrack = getPreviousTrack();
    if (prevTrack) {
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
    }
  }, [getPreviousTrack]);

  const handleEnded = useCallback(() => {
    // Play from queue first
    if (queue.length > 0) {
      const nextFromQueue = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentTrack(nextFromQueue);
      setIsPlaying(true);
      return;
    }
    
    // Otherwise play next from search results
    const nextTrack = getNextTrack();
    if (nextTrack && nextTrack.id !== currentTrack?.id) {
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [getNextTrack, currentTrack, queue]);

  const handleAddToQueue = useCallback((track: Track) => {
    setQueue(prev => {
      // Check if track already exists in queue
      if (prev.some(t => t.id === track.id)) {
        return prev; // Don't add duplicate
      }
      return [...prev, track];
    });
  }, []);

  const handleRemoveFromQueue = useCallback((trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const handleClearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const handlePlayFromQueue = useCallback((track: Track) => {
    setQueue(prev => prev.filter(t => t.id !== track.id));
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const handlePlaybackError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsPlaying(false);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <div className={`min-h-screen bg-zinc-900 text-white overflow-x-hidden ${!hasSearched ? 'fixed inset-0 overflow-hidden' : ''}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white text-lg sm:text-xl font-bold">R</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Rayyfy</h1>
            </div>
            <a
              href="https://github.com/RasyaGtps"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <FiGithub className="text-xl" />
            </a>
          </div>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </header>

      {/* Main content */}
      <main className={`max-w-4xl mx-auto px-3 sm:px-4 ${hasSearched ? 'py-4 sm:py-6 pb-24 sm:pb-28' : 'py-2 sm:py-6 pb-20 sm:pb-24'}`}>
        {error && (
          <div 
            className="flex items-center justify-between bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 animate-pulse"
            role="alert"
          >
            <span>{error}</span>
            <button onClick={dismissError} className="hover:text-red-300 transition-colors" aria-label="Dismiss">
              <FiX className="text-xl" />
            </button>
          </div>
        )}

        {/* Welcome screen */}
        {!hasSearched && searchResults.length === 0 && (
          <div className="fixed inset-0 flex flex-col items-center justify-center text-center px-4 bg-zinc-900 z-0" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-purple-500/30 animate-pulse">
              <FiMusic className="text-white text-2xl sm:text-4xl" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Welcome to Rayyfy</h2>
            <p className="text-zinc-400 max-w-md text-sm sm:text-base mb-4 sm:mb-6">
              Discover and stream millions of songs for free. Start by searching your favorite artist or song.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center max-w-xs sm:max-w-sm">
              <div className="p-3 sm:p-3 bg-zinc-800/50 rounded-lg sm:rounded-xl">
                <FiMusic className="text-xl sm:text-2xl text-purple-400 mx-auto mb-1" />
                <p className="text-xs sm:text-xs text-zinc-400">Stream</p>
              </div>
              <div className="p-3 sm:p-3 bg-zinc-800/50 rounded-lg sm:rounded-xl">
                <FiDownload className="text-xl sm:text-2xl text-purple-400 mx-auto mb-1" />
                <p className="text-xs sm:text-xs text-zinc-400">Download</p>
              </div>
              <div className="p-3 sm:p-3 bg-zinc-800/50 rounded-lg sm:rounded-xl">
                <FiList className="text-xl sm:text-2xl text-purple-400 mx-auto mb-1" />
                <p className="text-xs sm:text-xs text-zinc-400">Queue</p>
              </div>
            </div>
          </div>
        )}

        {/* Search results */}
        {hasSearched && (
          <>
            {searchResults.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-zinc-300">
                  {searchResults.length} results found
                </h2>
              </div>
            )}
            <TrackList
              tracks={searchResults}
              onTrackSelect={handleTrackSelect}
              onAddToQueue={handleAddToQueue}
              onDownload={handleDownloadTrack}
              currentTrackId={currentTrack?.id || null}
              isPlaying={isPlaying}
            />
          </>
        )}
      </main>
      
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={searchResults.length > 1 ? handleNext : undefined}
        onPrevious={searchResults.length > 1 ? handlePrevious : undefined}
        onEnded={handleEnded}
        onError={handlePlaybackError}
        shuffle={shuffle}
        onShuffleToggle={() => setShuffle(!shuffle)}
        repeat={repeat}
        onRepeatToggle={() => setRepeat(!repeat)}
        queueCount={queue.length}
        onQueueToggle={() => setIsQueueOpen(true)}
        onDownloadToggle={() => {
          setDownloadTrack(currentTrack);
          setIsDownloadOpen(true);
        }}
        audioQuality={audioQuality}
        onQualityChange={setAudioQuality}
      />

      <Queue
        queue={queue}
        currentTrack={currentTrack}
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        onPlayTrack={handlePlayFromQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
      />

      <Download
        track={downloadTrack || currentTrack}
        isOpen={isDownloadOpen}
        onClose={() => {
          setIsDownloadOpen(false);
          setDownloadTrack(null);
        }}
      />
    </div>
  );
};

export default App;
