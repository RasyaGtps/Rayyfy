import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlay, FaTrash } from 'react-icons/fa';
import { MdQueueMusic } from 'react-icons/md';
import { Track } from '../../shared/types';

export interface QueueProps {
  queue: Track[];
  currentTrack: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onClearQueue: () => void;
}

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const Queue: React.FC<QueueProps> = ({
  queue,
  currentTrack,
  isOpen,
  onClose,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 280); // Match animation duration
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      {/* Queue panel */}
      <div className={`relative w-full max-w-md bg-zinc-900 h-full overflow-hidden flex flex-col ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MdQueueMusic className="text-xl text-purple-400" />
            <h2 className="text-lg font-semibold">Queue</h2>
            <span className="text-sm text-zinc-500">({queue.length} tracks)</span>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                className="text-sm text-zinc-400 hover:text-red-400 transition-colors px-2 py-1"
              >
                Clear all
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close queue"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Now playing */}
        {currentTrack && (
          <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Now Playing</p>
            <div className="flex items-center gap-3">
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.album}
                className="w-12 h-12 rounded-md object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-purple-400 truncate">{currentTrack.title}</p>
                <p className="text-sm text-zinc-400 truncate">{currentTrack.artist}</p>
              </div>
            </div>
          </div>
        )}

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MdQueueMusic className="text-4xl text-zinc-600 mb-3" />
              <p className="text-zinc-400">Queue is empty</p>
              <p className="text-sm text-zinc-500 mt-1">Add songs from search results</p>
            </div>
          ) : (
            <div className="p-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wide px-2 py-2">Next Up</p>
              {queue.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className="group flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="w-6 text-center text-zinc-500 text-sm">{index + 1}</span>
                  <img
                    src={track.albumArt}
                    alt={track.album}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{track.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs text-zinc-500">{formatDuration(track.duration)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                      aria-label="Play now"
                    >
                      <FaPlay className="text-xs" />
                    </button>
                    <button
                      onClick={() => onRemoveFromQueue(track.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                      aria-label="Remove from queue"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Queue;
