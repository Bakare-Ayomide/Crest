import React, { useState } from 'react';
import { 
  Search, Pin, BellOff, Check, CheckCheck, Sparkles, 
  Flame, Heart, MoreVertical, Trash2, Bell, ShieldCheck, 
  Compass, MessageCircle, Filter, Users
} from 'lucide-react';
import { Match, UserProfile } from '../../types';
import { triggerHaptic } from '../../lib/capacitor';

interface ConversationListProps {
  matches: Match[];
  selectedMatchId: string | null;
  onSelectMatch: (match: Match) => void;
  onTogglePin: (matchId: string) => void;
  onToggleMute: (matchId: string) => void;
  onMarkRead: (matchId: string) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenMatchProfile: (user: UserProfile) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  matches,
  selectedMatchId,
  onSelectMatch,
  onTogglePin,
  onToggleMute,
  onMarkRead,
  onDeleteMatch,
  onOpenMatchProfile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'online' | 'pinned'>('all');
  const [activeMenuMatchId, setActiveMenuMatchId] = useState<string | null>(null);

  // New Matches carousel: matches that have recent match date or unread
  const newMatches = matches.slice(0, 8);

  // Filter matches
  const filteredMatches = matches.filter(match => {
    // Search query matching name, location, or last message
    const lastMsgText = typeof match.lastMessage === 'string'
      ? match.lastMessage
      : match.lastMessage?.text || (match.lastMessage?.isImage ? '📷 Photo' : match.lastMessage?.isAudio ? '🎤 Voice note' : match.lastMessage?.isVideo ? '📹 Video' : match.lastMessage?.isDateInvite ? '🍸 Date Proposal' : '');

    const matchesSearch =
      match.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.user.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.user.interests?.some(i => i.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lastMsgText.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'unread') return match.unreadCount > 0;
    if (activeFilter === 'online') return match.onlineStatus === 'online';
    if (activeFilter === 'pinned') return match.isPinned;

    return true;
  });

  // Sort pinned to top, then by timestamp
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.unreadCount || 0) - (a.unreadCount || 0);
  });

  const totalUnreadCount = matches.reduce((acc, m) => acc + (m.unreadCount || 0), 0);

  return (
    <div className="h-full flex flex-col bg-[#121316] text-white border-r border-white/10 select-none">
      
      {/* Top Header */}
      <div className="p-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md">
              <MessageCircle className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Messages</h2>
          </div>

          {totalUnreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold text-xs shadow-md animate-pulse">
              {totalUnreadCount} unread
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matches or chats..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Chats' },
            { id: 'unread', label: 'Unread' },
            { id: 'online', label: 'Online' },
            { id: 'pinned', label: 'Pinned' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveFilter(tab.id as any);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* NEW MATCHES HORIZONTAL STORY CAROUSEL */}
      {activeFilter === 'all' && !searchQuery && newMatches.length > 0 && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-400" />
              <span>New Matches</span>
            </h4>
            <span className="text-[10px] text-gray-500 font-mono">{newMatches.length} recent</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
            {newMatches.map(match => (
              <div
                key={match.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectMatch(match);
                }}
                className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0"
              >
                <div className="relative">
                  <img
                    src={match.user.photos[0]}
                    alt={match.user.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-rose-500 group-hover:scale-105 transition-transform"
                  />
                  {match.onlineStatus === 'online' && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-[#121316]" />
                  )}
                  {match.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#121316]">
                      {match.unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-gray-200 truncate max-w-[60px] text-center">
                  {match.user.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONVERSATION LIST ITEMS */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {sortedMatches.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-500">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-300">No conversations found</p>
            <p className="text-xs text-gray-500">Try changing your search or filter</p>
          </div>
        ) : (
          sortedMatches.map(match => {
            const isSelected = selectedMatchId === match.id;
            return (
              <div
                key={match.id}
                onClick={() => {
                  triggerHaptic('light');
                  onSelectMatch(match);
                }}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors relative group ${
                  isSelected
                    ? 'bg-rose-500/10 border-l-4 border-rose-500'
                    : 'hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                {/* Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMatchProfile(match.user);
                    }}
                    className="relative flex-shrink-0"
                  >
                    <img
                      src={match.user.photos[0]}
                      alt={match.user.name}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10 group-hover:scale-102 transition-transform"
                    />
                    {match.onlineStatus === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#121316]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                          {match.user.name}
                        </h4>
                        {match.user.verified && (
                          <span className="p-0.5 rounded-full bg-blue-500 text-white flex-shrink-0">
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

                      <span className="text-[10px] text-gray-400 font-mono flex-shrink-0 ml-2">
                        {match.lastMessageTime || 'Just now'}
                      </span>
                    </div>

                      {/* Latest Message Preview / Typing status */}
                      <div className="flex items-center justify-between text-xs">
                        {match.isTyping ? (
                          <p className="text-rose-400 font-semibold animate-pulse text-[11px] truncate">
                            typing...
                          </p>
                        ) : (
                          <p
                            className={`truncate text-[11px] ${
                              match.unreadCount > 0
                                ? 'text-white font-bold'
                                : 'text-gray-400'
                            }`}
                          >
                            {typeof match.lastMessage === 'string'
                              ? match.lastMessage
                              : match.lastMessage?.text ||
                                (match.lastMessage?.isImage ? '📷 Photo' : match.lastMessage?.isAudio ? '🎤 Voice note' : match.lastMessage?.isVideo ? '📹 Video' : match.lastMessage?.isDateInvite ? '🍸 Date Proposal' : 'Say hello! 👋')}
                          </p>
                        )}

                      {/* Unread Counter Badge */}
                      {match.unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex-shrink-0 shadow-sm">
                          {match.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown Options Menu */}
                <div className="relative ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuMatchId(activeMenuMatchId === match.id ? null : match.id);
                    }}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {activeMenuMatchId === match.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuMatchId(null);
                      }} />
                      <div className="absolute right-0 top-full mt-1 w-44 bg-[#1c1e22] border border-white/10 rounded-2xl shadow-2xl p-1 z-50 text-xs text-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(match.id);
                            setActiveMenuMatchId(null);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
                        >
                          <Pin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{match.isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleMute(match.id);
                            setActiveMenuMatchId(null);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
                        >
                          {match.isMuted ? <Bell className="w-3.5 h-3.5 text-emerald-400" /> : <BellOff className="w-3.5 h-3.5 text-gray-400" />}
                          <span>{match.isMuted ? 'Unmute' : 'Mute'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkRead(match.id);
                            setActiveMenuMatchId(null);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-rose-400" />
                          <span>Mark Read</span>
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMatch(match.id);
                            setActiveMenuMatchId(null);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Chat</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
