import React, { useRef, useEffect, useState } from 'react';
import { FaPlay, FaPause, FaStepForward, FaStepBackward, FaRandom, FaRedo, FaVolumeUp, FaVolumeMute, FaVolumeDown, FaDownload, FaChevronDown, FaChevronUp, FaCog } from 'react-icons/fa';
import { MdQueueMusic } from 'react-icons/md';
import { Track } from '../../shared/types';

export interface AudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  shuffle?: boolean;
  onShuffleToggle?: () => void;
  repeat?: boolean;
  onRepeatToggle?: () => void;
  queueCount?: number;
  onQueueToggle?: () => void;
  onDownloadToggle?: () => void;
  audioQuality?: string;
  onQualityChange?: (quality: string) => void;
}

const QUALITY_OPTIONS = [
  { value: '320kbps', label: '320 kbps (Best)' },
  { value: '160kbps', label: '160 kbps (High)' },
  { value: '96kbps', label: '96 kbps (Normal)' },
  { value: '48kbps', label: '48 kbps (Low)' },
];

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onEnded,
  onError,
  shuffle = false,
  onShuffleToggle,
  repeat = false,
  onRepeatToggle,
  queueCount = 0,
  onQueueToggle,
  onDownloadToggle,
  audioQuality = '320kbps',
  onQualityChange
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Create audio element once and keep it
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;
    
    const handleEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        onEnded?.();
      }
    };
    
    const handleError = () => onError?.('Playback error occurred');
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
    };
  }, [onEnded, onError, repeat]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          isPlaying ? onPause() : onPlay();
          break;
        case 'ArrowRight':
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
          }
          break;
        case 'ArrowLeft':
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(v => Math.min(v + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(v => Math.max(v - 0.1, 0));
          break;
        case 'KeyM':
          setIsMuted(m => !m);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onPlay, onPause, duration]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.previewUrl) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        if (err.name !== 'AbortError') {
          onError?.(`Unable to play: ${err.message}`);
        }
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, onError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // Get audio URL based on selected quality
    const getAudioUrl = () => {
      if (currentTrack.downloadUrls && currentTrack.downloadUrls.length > 0) {
        const selectedUrl = currentTrack.downloadUrls.find(d => d.quality === audioQuality);
        if (selectedUrl) return selectedUrl.url;
        // Fallback to highest available
        return currentTrack.downloadUrls[currentTrack.downloadUrls.length - 1]?.url;
      }
      return currentTrack.previewUrl;
    };

    const audioUrl = getAudioUrl();
    if (!audioUrl) return;

    setCurrentTime(0);
    setDuration(0);
    audio.src = audioUrl;
    audio.load();

    const handleCanPlay = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      if (isPlaying) {
        audio.play().catch((err) => {
          if (err.name !== 'AbortError') {
            onError?.(`Unable to play: ${err.message}`);
          }
        });
      }
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentTrack?.id, audioQuality, isPlaying, onError]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    try {
      audio.currentTime = newTime;
    } catch (err) {
      console.error('Seek error:', err);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(false);
  };

  const VolumeIcon = isMuted || volume === 0 ? FaVolumeMute : volume < 0.5 ? FaVolumeDown : FaVolumeUp;

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex justify-center items-center text-zinc-500 text-sm sm:text-base">
          <p>Select a track to start playing</p>
        </div>
      </div>
    );
  }

  const hasPreview = currentTrack.previewUrl !== null;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Mini player mode
  if (isMiniMode) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden w-72 animate-fade-in">
        {/* Progress bar on top */}
        <div className="h-1 bg-zinc-800">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="p-3 flex items-center gap-3">
          {/* Album art */}
          <div className="relative flex-shrink-0">
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.album}
              className="w-12 h-12 rounded-lg object-cover shadow-md"
            />
            {isPlaying && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            )}
          </div>
          
          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artist}</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-1">
            {hasPreview && (
              <button
                onClick={isPlaying ? onPause : onPlay}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-purple-400 transition-colors"
              >
                {isPlaying ? (
                  <FaPause className="text-black text-xs" />
                ) : (
                  <FaPlay className="text-black text-xs ml-0.5" />
                )}
              </button>
            )}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                >
                  <FaStepForward className="text-xs" />
                </button>
              )}
              <button
                onClick={() => setIsMiniMode(false)}
                className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                aria-label="Expand player"
              >
                <FaChevronUp className="text-xs" />
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
      {/* Progress bar */}
      {hasPreview && (
        <div className="px-3 sm:px-4 pt-2">
          <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-zinc-400 w-8 sm:w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
            <div className="flex-1 relative h-1 bg-zinc-700 rounded-full group cursor-pointer">
              <div 
                className="absolute top-0 left-0 h-full bg-purple-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>
            <span className="text-xs text-zinc-400 w-8 sm:w-10 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>
      )}

      <div className="p-2 sm:p-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
          {/* Track info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                src={currentTrack.albumArt}
                alt={`${currentTrack.album} album art`}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-md sm:rounded-lg object-cover shadow-lg"
              />
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate text-white text-sm sm:text-base">{currentTrack.title}</p>
              <p className="text-xs sm:text-sm text-zinc-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Shuffle - hidden on mobile */}
            {onShuffleToggle && (
              <button
                onClick={onShuffleToggle}
                className={`hidden sm:block p-2 rounded-full transition-all ${shuffle ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                aria-label="Shuffle"
              >
                <FaRandom className="text-sm" />
              </button>
            )}
            
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Previous"
              >
                <FaStepBackward className="text-sm sm:text-base" />
              </button>
            )}

            {hasPreview ? (
              <button
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 hover:bg-purple-400 transition-all shadow-lg"
                onClick={isPlaying ? onPause : onPlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <FaPause className="text-black text-sm sm:text-base" />
                ) : (
                  <FaPlay className="text-black text-sm sm:text-base ml-0.5" />
                )}
              </button>
            ) : (
              <span className="text-red-400 text-xs sm:text-sm px-2">No preview</span>
            )}

            {onNext && (
              <button
                onClick={onNext}
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Next"
              >
                <FaStepForward className="text-sm sm:text-base" />
              </button>
            )}

            {/* Repeat - hidden on mobile */}
            {onRepeatToggle && (
              <button
                onClick={onRepeatToggle}
                className={`hidden sm:block p-2 rounded-full transition-all ${repeat ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                aria-label="Repeat"
              >
                <FaRedo className="text-sm" />
              </button>
            )}
          </div>

          {/* Volume - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon />
            </button>
            <div className="relative w-24 h-1 bg-zinc-700 rounded-full group cursor-pointer">
              <div 
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <input
                type="range"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </div>
            
            {/* Queue button */}
            {onQueueToggle && (
              <button
                onClick={onQueueToggle}
                className="relative p-2 text-zinc-400 hover:text-white transition-colors ml-2"
                aria-label="Open queue"
              >
                <MdQueueMusic className="text-lg" />
                {queueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-xs flex items-center justify-center text-white">
                    {queueCount > 9 ? '9+' : queueCount}
                  </span>
                )}
              </button>
            )}

            {/* Download button */}
            {onDownloadToggle && (
              <button
                onClick={onDownloadToggle}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Download"
              >
                <FaDownload className="text-base" />
              </button>
            )}

            {/* Quality selector */}
            {onQualityChange && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="p-2 text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                  aria-label="Audio quality"
                >
                  <FaCog className="text-base" />
                  <span className="text-xs">{audioQuality.replace('kbps', '')}</span>
                </button>
                
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 overflow-hidden min-w-[140px]">
                    {QUALITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onQualityChange(option.value);
                          setShowQualityMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 transition-colors ${
                          audioQuality === option.value ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Minimize button */}
            <button
              onClick={() => setIsMiniMode(true)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Minimize player"
            >
              <FaChevronDown className="text-base" />
            </button>
          </div>

          {/* Queue & Download buttons for mobile/tablet */}
          <div className="md:hidden flex items-center">
            {onDownloadToggle && (
              <button
                onClick={onDownloadToggle}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Download"
              >
                <FaDownload className="text-base" />
              </button>
            )}
            {onQueueToggle && (
              <button
                onClick={onQueueToggle}
                className="relative p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Open queue"
              >
                <MdQueueMusic className="text-lg" />
                {queueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full text-xs flex items-center justify-center text-white">
                    {queueCount > 9 ? '9+' : queueCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setIsMiniMode(true)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Minimize player"
            >
              <FaChevronDown className="text-base" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
