import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, Share2, Maximize2 } from 'lucide-react';
import { triggerHaptic, showNativeToast } from '../../lib/capacitor';

interface MediaLightboxProps {
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  senderName?: string;
  timestamp?: string;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  mediaUrl,
  mediaType = 'image',
  caption,
  senderName,
  timestamp,
  onClose
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
    triggerHaptic('light');
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    triggerHaptic('light');
  };

  const handleDownload = () => {
    triggerHaptic('medium');
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = `crest_media_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNativeToast('Media downloaded to device');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 text-white animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between z-10">
        <div>
          {senderName && (
            <h4 className="font-bold text-sm text-white">{senderName}</h4>
          )}
          {timestamp && (
            <p className="text-[11px] text-gray-400">{timestamp}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            title="Download Media"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 text-gray-300 hover:text-white transition-colors ml-2"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Media Container */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden my-4 select-none">
        {mediaType === 'video' ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-h-[75vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
            onError={(e) => {
              console.warn('Video failed to load in lightbox');
            }}
          />
        ) : (
          <div
            className="transition-transform duration-200 ease-out flex items-center justify-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={mediaUrl}
              alt={caption || 'Media Preview'}
              className="max-h-[75vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain pointer-events-auto"
            />
          </div>
        )}
      </div>

      {/* Bottom Caption Bar */}
      {caption && (
        <div className="bg-[#18191b]/90 border border-white/10 rounded-2xl p-3.5 max-w-lg mx-auto w-full text-center text-xs text-gray-200">
          {caption}
        </div>
      )}
    </div>
  );
};
