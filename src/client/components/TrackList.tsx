import React from 'react';
import { FaPlay, FaPlus, FaDownload } from 'react-icons/fa';
import { MdMusicOff } from 'react-icons/md';
import { Track } from '../../shared/types';

export interface TrackListProps {
  tracks: Track[];
  onTrackSelect: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onDownload?: (track: Track) => void;
  currentTrackId: string | null;
  isPlaying?: boolean;
}

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const TrackList: React.FC<TrackListProps> = ({ tracks, onTrackSelect, onAddToQueue, onDownload, currentTrackId, isPlaying = false }) => {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
          <MdMusicOff className="text-zinc-500 text-2xl" />
        </div>
        <p className="text-zinc-400">No tracks found</p>
        <p className="text-zinc-500 text-sm mt-1">Try searching for something else</p>
      </div>
    );
  }

  return (
    <div className="grid gap-1 sm:gap-2">
      {tracks.map((track, index) => {
        const isActive = track.id === currentTrackId;
        const hasPreview = track.previewUrl !== null;

        return (
          <div
            key={track.id}
            onClick={() => onTrackSelect(track)}
            className={`group flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${
              isActive 
                ? 'bg-zinc-800/80 shadow-lg' 
                : 'hover:bg-zinc-800/50 active:bg-zinc-800/70'
            }`}
          >
            {/* Track number / Play icon - hidden on mobile */}
            <div className="hidden sm:block w-8 text-center">
              {isActive && isPlaying ? (
                <div className="flex items-center justify-center gap-0.5">
                  <span className="w-1 h-4 bg-purple-500 rounded-full animate-pulse" />
                  <span className="w-1 h-3 bg-purple-500 rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-5 bg-purple-500 rounded-full animate-pulse delay-150" />
                </div>
              ) : (
                <>
                  <span className="text-zinc-500 group-hover:hidden">{index + 1}</span>
                  <FaPlay className="text-white hidden group-hover:block mx-auto text-sm" />
                </>
              )}
            </div>

            {/* Album art */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
              <img
                src={track.albumArt}
                alt={`${track.album} album art`}
                className="w-full h-full rounded-md sm:rounded-lg object-cover shadow-md"
              />
              {isActive && (
                <div className="absolute inset-0 rounded-md sm:rounded-lg ring-2 ring-purple-500" />
              )}
              {/* Mobile playing indicator */}
              {isActive && isPlaying && (
                <div className="sm:hidden absolute inset-0 bg-black/40 rounded-md flex items-center justify-center">
                  <div className="flex items-center gap-0.5">
                    <span className="w-0.5 h-3 bg-purple-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-2 bg-purple-400 rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-4 bg-purple-400 rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate text-sm sm:text-base ${isActive ? 'text-purple-400' : 'text-white'}`}>
                {track.title}
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 truncate">{track.artist}</p>
            </div>

            {/* No preview badge - icon only on mobile */}
            {!hasPreview && (
              <div className="flex items-center gap-1 text-amber-500 text-xs bg-amber-500/10 px-1.5 sm:px-2 py-1 rounded-full">
                <MdMusicOff className="text-sm" />
                <span className="hidden sm:inline">No audio</span>
              </div>
            )}

            {/* Duration */}
            <span className="text-zinc-500 text-xs sm:text-sm tabular-nums">
              {formatDuration(track.duration)}
            </span>

            {/* Desktop: Add to queue & Download buttons */}
            {onAddToQueue && hasPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToQueue(track);
                }}
                className="hidden sm:block p-2 text-zinc-400 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Add to queue"
                title="Add to queue"
              >
                <FaPlus className="text-sm" />
              </button>
            )}

            {onDownload && hasPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(track);
                }}
                className="hidden sm:block p-2 text-zinc-400 hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Download"
                title="Download"
              >
                <FaDownload className="text-sm" />
              </button>
            )}

            {/* Mobile: Action buttons below duration */}
            {hasPreview && (onAddToQueue || onDownload) && (
              <div className="sm:hidden w-full flex items-center justify-end gap-2 mt-1 pl-12">
                {onAddToQueue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(track);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 active:text-purple-400 bg-zinc-800 rounded-md"
                    aria-label="Add to queue"
                  >
                    <FaPlus className="text-xs" />
                    <span>Queue</span>
                  </button>
                )}
                {onDownload && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(track);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 active:text-purple-400 bg-zinc-800 rounded-md"
                    aria-label="Download"
                  >
                    <FaDownload className="text-xs" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TrackList;
