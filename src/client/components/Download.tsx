import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload, FaCheck } from 'react-icons/fa';
import { Track } from '../../shared/types';

export interface DownloadProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

interface DownloadUrl {
  quality: string;
  url: string;
}

const JIOSAAVN_API = import.meta.env.VITE_JIOSAAVN_API_URL || 'https://spotify-ivory-one.vercel.app';

const qualityLabels: Record<string, string> = {
  '12kbps': '12 kbps (Low)',
  '48kbps': '48 kbps (Basic)',
  '96kbps': '96 kbps (Normal)',
  '160kbps': '160 kbps (High)',
  '320kbps': '320 kbps (Best)'
};

const Download: React.FC<DownloadProps> = ({ track, isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<DownloadUrl[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('320kbps');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen && track) {
      setIsVisible(true);
      setIsAnimating(false);
      fetchDownloadUrls();
    }
  }, [isOpen, track?.id]);

  const fetchDownloadUrls = async () => {
    if (!track) return;
    try {
      const response = await fetch(`${JIOSAAVN_API}/api/songs/${track.id}`);
      const data = await response.json();
      if (data.success && data.data?.[0]?.downloadUrl) {
        setDownloadUrls(data.data[0].downloadUrl);
        const best = data.data[0].downloadUrl.find((d: DownloadUrl) => d.quality === '320kbps');
        if (best) setSelectedQuality('320kbps');
        else if (data.data[0].downloadUrl.length > 0) {
          setSelectedQuality(data.data[0].downloadUrl[data.data[0].downloadUrl.length - 1].quality);
        }
      }
    } catch (err) {
      console.error('Failed to fetch download URLs:', err);
    }
  };

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
      onClose();
    }, 280);
  };

  const handleDownload = async () => {
    const selected = downloadUrls.find(d => d.quality === selectedQuality);
    if (!selected || !track) return;

    setIsDownloading(true);
    try {
      const response = await fetch(selected.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[Rayyfy] ${track.title} - ${track.artist}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />
      
      {/* Download panel */}
      <div className={`relative w-full max-w-md bg-zinc-900 rounded-2xl overflow-hidden flex flex-col ${isAnimating ? 'animate-fade-out' : 'animate-fade-in'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-3 min-w-0">
            {track && (
              <>
                <img
                  src={track.albumArt}
                  alt={track.album}
                  className="w-12 h-12 rounded-lg object-cover shadow-lg"
                />
                <div className="min-w-0">
                  <h2 className="font-semibold text-white truncate">{track.title}</h2>
                  <p className="text-sm text-zinc-400 truncate">{track.artist}</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-zinc-400 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-zinc-400">Select quality:</p>
          
          <div className="space-y-2">
            {downloadUrls.map((item) => (
              <button
                key={item.quality}
                onClick={() => setSelectedQuality(item.quality)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedQuality === item.quality
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                }`}
              >
                <span className="text-white">{qualityLabels[item.quality] || item.quality}</span>
                {selectedQuality === item.quality && (
                  <FaCheck className="text-purple-400" />
                )}
              </button>
            ))}
          </div>

          {downloadUrls.length === 0 && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">Loading...</p>
            </div>
          )}

          {downloadUrls.length > 0 && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <FaDownload />
                  Download
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Download;
