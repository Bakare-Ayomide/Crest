import React, { useState } from 'react';
import { ChevronLeft, Phone, Video, Search, MoreVertical, Compass, ShieldAlert, Ban, UserX, Check, Pin, BellOff, Bell, Trash2, Info, ExternalLink } from 'lucide-react';
import { Match, UserProfile } from '../../types';
import { triggerHaptic } from '../../lib/capacitor';

interface ChatHeaderProps {
  match: Match;
  onBack: () => void;
  onVoiceCall: () => void;
  onVideoCall: () => void;
  onOpenSearch: () => void;
  onOpenDateIdeas: () => void;
  onOpenProfileDrawer: () => void;
  onTogglePin: () => void;
  onToggleMute: () => void;
  onClearHistory: () => void;
  onUnmatch: () => void;
  onBlock: () => void;
  onReport: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  match,
  onBack,
  onVoiceCall,
  onVideoCall,
  onOpenSearch,
  onOpenDateIdeas,
  onOpenProfileDrawer,
  onTogglePin,
  onToggleMute,
  onClearHistory,
  onUnmatch,
  onBlock,
  onReport
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="bg-[#141517]/95 backdrop-blur-md border-b border-white/10 px-3 py-2.5 flex items-center justify-between z-30 shadow-md text-white">
      {/* Left: Back button + Avatar + Match status */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          title="Back to matches"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          onClick={() => {
            triggerHaptic('light');
            onOpenProfileDrawer();
          }}
          className="relative cursor-pointer group flex-shrink-0"
        >
          <img
            src={match.user.photos[0]}
            alt={match.user.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500/80 group-hover:scale-105 transition-transform"
          />
          {match.onlineStatus === 'online' ? (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#141517]" />
          ) : match.onlineStatus === 'away' ? (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-[#141517]" />
          ) : null}
        </div>

        <div
          onClick={() => {
            triggerHaptic('light');
            onOpenProfileDrawer();
          }}
          className="cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-white truncate max-w-[130px] sm:max-w-[200px]">
              {match.user.name}
            </h3>
            {match.user.verified && (
              <span className="p-0.5 rounded-full bg-blue-500 text-white flex-shrink-0" title="Verified">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
            {match.isPinned && (
              <Pin className="w-3 h-3 text-amber-400 fill-amber-400 rotate-45 flex-shrink-0" />
            )}
            {match.isMuted && (
              <BellOff className="w-3 h-3 text-gray-400 flex-shrink-0" />
            )}
          </div>

          <p className="text-[11px] font-medium truncate">
            {match.isTyping ? (
              <span className="text-rose-400 animate-pulse font-semibold">typing...</span>
            ) : match.onlineStatus === 'online' ? (
              <span className="text-emerald-400">Active Now</span>
            ) : match.lastSeen ? (
              <span className="text-gray-400">{match.lastSeen}</span>
            ) : (
              <span className="text-gray-400">{match.user.locationName}</span>
            )}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenDateIdeas();
          }}
          className="p-2 rounded-xl text-amber-400 hover:bg-amber-400/10 transition-colors"
          title="AI First Date Ideas"
        >
          <Compass className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onVoiceCall();
          }}
          className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Voice Call"
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            triggerHaptic('heavy');
            onVideoCall();
          }}
          className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Video Call"
        >
          <Video className="w-5 h-5" />
        </button>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#1c1e22] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-gray-200 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenProfileDrawer();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
                >
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>View Profile & Bio</span>
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenSearch();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
                >
                  <Search className="w-4 h-4 text-gray-300" />
                  <span>Search in Chat</span>
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onTogglePin();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
                >
                  <Pin className="w-4 h-4 text-amber-400" />
                  <span>{match.isPinned ? 'Unpin Conversation' : 'Pin to Top'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onToggleMute();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
                >
                  {match.isMuted ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4 text-gray-400" />}
                  <span>{match.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                </button>

                <div className="h-px bg-white/10 my-1" />

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onClearHistory();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left text-gray-300"
                >
                  <Trash2 className="w-4 h-4 text-gray-400" />
                  <span>Clear Chat History</span>
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onUnmatch();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-amber-500/20 text-amber-300 flex items-center gap-2 text-left"
                >
                  <UserX className="w-4 h-4" />
                  <span>Unmatch</span>
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onBlock();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-left"
                >
                  <Ban className="w-4 h-4" />
                  <span>Block User</span>
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onReport();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-left"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Report User</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
