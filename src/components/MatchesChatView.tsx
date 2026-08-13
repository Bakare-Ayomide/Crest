import React, { useState, useEffect, useRef } from 'react';
import { Match, Message, UserProfile, DateInviteData } from '../types';
import { ConversationList } from './chat/ConversationList';
import { ChatHeader } from './chat/ChatHeader';
import { ChatSearch } from './chat/ChatSearch';
import { MessageBubble } from './chat/MessageBubble';
import { ChatComposer } from './chat/ChatComposer';
import { MediaLightbox } from './chat/MediaLightbox';
import { ActiveCallModal } from './chat/ActiveCallModal';
import { UserProfileDrawer } from './chat/UserProfileDrawer';
import { DateIdeasModal } from './chat/DateIdeasModal';
import { BlockConfirmModal, UnmatchConfirmModal, ReportModal } from './chat/SafetyModals';
import { ForwardModal } from './chat/ForwardModal';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';
import { ArrowDown, Sparkles, ShieldCheck } from 'lucide-react';

interface MatchesChatViewProps {
  matches: Match[];
  activeMatch: Match | null;
  setActiveMatch: (match: Match | null) => void;
  onSendMessage?: (matchId: string, text: string, media?: any) => void;
  onReportProfile: (profile: UserProfile) => void;
}

export const MatchesChatView: React.FC<MatchesChatViewProps> = ({
  matches: initialMatches,
  activeMatch,
  setActiveMatch,
  onReportProfile
}) => {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Replying state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // In-chat search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchesIndexes, setSearchMatchesIndexes] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // Modals & Drawers state
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video'; caption?: string } | null>(null);
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; isIncoming?: boolean } | null>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showDateIdeasModal, setShowDateIdeasModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  // Scroll & UX state
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Synchronize matches with parent updates
  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  // Load messages whenever activeMatch changes
  useEffect(() => {
    if (!activeMatch) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/chat/${activeMatch!.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMessages(data.messages || []);
          }
        } else {
          // Fallback initial messages from match
          if (isMounted) {
            const fallback: Message[] = [];
            if (activeMatch!.lastMessage) {
              if (typeof activeMatch!.lastMessage === 'string') {
                fallback.push({
                  id: `msg_init_1`,
                  matchId: activeMatch!.id,
                  senderId: activeMatch!.user.id,
                  senderName: activeMatch!.user.name,
                  text: activeMatch!.lastMessage,
                  timestamp: activeMatch!.lastMessageTime || '10:24 AM',
                  status: 'read'
                });
              } else {
                fallback.push(activeMatch!.lastMessage);
              }
            }
            setMessages(fallback);
          }
        }
      } catch (err) {
        console.warn('Could not fetch server messages, using local state:', err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    }

    fetchMessages();

    // Mark match as read
    setMatches(prev => prev.map(m => m.id === activeMatch.id ? { ...m, unreadCount: 0 } : m));

    return () => {
      isMounted = false;
    };
  }, [activeMatch?.id]);

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    if (!showSearch) {
      scrollToBottom();
    }
  }, [messages.length]);

  // In-Chat Search indexing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatchesIndexes([]);
      setCurrentSearchIndex(0);
      return;
    }

    const indices: number[] = [];
    messages.forEach((msg, idx) => {
      if (msg.text && msg.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        indices.push(idx);
      }
    });

    setSearchMatchesIndexes(indices);
    setCurrentSearchIndex(0);

    if (indices.length > 0) {
      const targetId = messages[indices[0]].id;
      scrollToMessageId(targetId);
    }
  }, [searchQuery, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottomBtn(false);
  };

  const scrollToMessageId = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2500);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottomBtn(isUp);
  };

  // SEND TEXT MESSAGE
  const handleSendMessage = async (text: string) => {
    if (!activeMatch) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      matchId: activeMatch.id,
      senderId: 'user_me',
      senderName: 'You',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderId: replyingTo.senderId,
            senderName: replyingTo.senderId === 'user_me' ? 'You' : activeMatch.user.name,
            text: replyingTo.text || 'Media Message'
          }
        : undefined
    };

    // Optimistic insert
    setMessages(prev => [...prev, newMsg]);
    setReplyingTo(null);

    // Update match preview in list
    setMatches(prev => prev.map(m => m.id === activeMatch.id ? { ...m, lastMessage: text, lastMessageTime: 'Just now' } : m));

    // Try server post
    try {
      const res = await fetch(`/api/chat/${activeMatch.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });

      if (res.ok) {
        const saved = await res.json();
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered' } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent' } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent' } : m));
    }

    // SIMULATE MATCH TYPING & REPLY
    triggerSimulatedMatchReply(activeMatch);
  };

  // SEND MEDIA / FILE ATTACHMENT
  const handleSendMedia = async (file: File, type: 'image' | 'video' | 'file', caption?: string) => {
    if (!activeMatch) return;

    const previewUrl = URL.createObjectURL(file);
    const newMsg: Message = {
      id: `msg_media_${Date.now()}`,
      matchId: activeMatch.id,
      senderId: 'user_me',
      senderName: 'You',
      text: caption || '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
      isImage: type === 'image',
      imageUrl: type === 'image' ? previewUrl : undefined,
      imageCaption: type === 'image' ? caption : undefined,
      isVideo: type === 'video',
      videoUrl: type === 'video' ? previewUrl : undefined,
      isFile: type === 'file',
      fileUrl: previewUrl,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    };

    setMessages(prev => [...prev, newMsg]);

    // Send payload to backend
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (caption) formData.append('caption', caption);

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'delivered', imageUrl: data.url || m.imageUrl } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent' } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, status: 'sent' } : m));
    }

    triggerSimulatedMatchReply(activeMatch);
  };

  // SEND VOICE NOTE
  const handleSendVoiceNote = async (audioUrl: string, duration: string, waveform: number[]) => {
    if (!activeMatch) return;

    const newMsg: Message = {
      id: `msg_voice_${Date.now()}`,
      matchId: activeMatch.id,
      senderId: 'user_me',
      senderName: 'You',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isAudio: true,
      audioUrl,
      audioDuration: duration,
      audioWaveform: waveform
    };

    setMessages(prev => [...prev, newMsg]);
    setMatches(prev => prev.map(m => m.id === activeMatch.id ? { ...m, lastMessage: `🎤 Voice note (${duration})`, lastMessageTime: 'Just now' } : m));

    triggerSimulatedMatchReply(activeMatch);
  };

  // SEND FIRST DATE INVITE
  const handleSendDateInvite = (dateData: DateInviteData) => {
    if (!activeMatch) return;

    const newMsg: Message = {
      id: `msg_date_${Date.now()}`,
      matchId: activeMatch.id,
      senderId: 'user_me',
      senderName: 'You',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isDateInvite: true,
      dateInvite: dateData
    };

    setMessages(prev => [...prev, newMsg]);
    setMatches(prev => prev.map(m => m.id === activeMatch.id ? { ...m, lastMessage: `🍸 Date Invite: ${dateData.title}`, lastMessageTime: 'Just now' } : m));

    // Simulate match accepting date invite after 3 seconds
    setTimeout(() => {
      setMessages(prev => prev.map(m => {
        if (m.id === newMsg.id && m.dateInvite) {
          return {
            ...m,
            dateInvite: {
              ...m.dateInvite,
              status: 'accepted'
            }
          };
        }
        return m;
      }));

      const acceptMsg: Message = {
        id: `msg_resp_${Date.now()}`,
        matchId: activeMatch.id,
        senderId: activeMatch.user.id,
        senderName: activeMatch.user.name,
        text: `I would love that! Count me in for ${dateData.title} ✨🥂`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered'
      };

      setMessages(prev => [...prev, acceptMsg]);
      triggerHaptic('success');
      showNativeToast(`${activeMatch.user.name} accepted your date proposal! 🥂`);
    }, 3200);
  };

  // SIMULATE MATCH TYPING AND RESPONDING
  const triggerSimulatedMatchReply = (targetMatch: Match) => {
    // 1. Set typing indicator
    setTimeout(() => {
      setMatches(prev => prev.map(m => m.id === targetMatch.id ? { ...m, isTyping: true } : m));
    }, 1200);

    // 2. Mark our messages as read
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.senderId === 'user_me' ? { ...m, status: 'read' } : m));
    }, 2000);

    // 3. Post reply
    setTimeout(() => {
      const dynamicReplies = [
        `Haha that's amazing! You just made my day 😊`,
        `I was literally thinking the exact same thing! What else are you up to this weekend?`,
        `Sounds like a plan! Let's definitely do it ✨`,
        `Your taste in music and places is top tier 👌`,
        `Can't wait to chat more about that over coffee ☕`
      ];
      const replyText = dynamicReplies[Math.floor(Math.random() * dynamicReplies.length)];

      const incomingMsg: Message = {
        id: `msg_in_${Date.now()}`,
        matchId: targetMatch.id,
        senderId: targetMatch.user.id,
        senderName: targetMatch.user.name,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered'
      };

      setMatches(prev => prev.map(m => m.id === targetMatch.id ? { ...m, isTyping: false, lastMessage: replyText, lastMessageTime: 'Just now' } : m));
      setMessages(prev => [...prev, incomingMsg]);
      triggerHaptic('light');
    }, 3800);
  };

  // REACT TO MESSAGE
  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;

      const currentReactions = msg.reactions ? [...msg.reactions] : [];
      const existingReactionIdx = currentReactions.findIndex(r => r.emoji === emoji);

      if (existingReactionIdx >= 0) {
        const reaction = currentReactions[existingReactionIdx];
        if (reaction.userIds.includes('user_me')) {
          reaction.userIds = reaction.userIds.filter(id => id !== 'user_me');
          if (reaction.userIds.length === 0) {
            currentReactions.splice(existingReactionIdx, 1);
          }
        } else {
          reaction.userIds.push('user_me');
        }
      } else {
        currentReactions.push({ emoji, userIds: ['user_me'] });
      }

      return {
        ...msg,
        reactions: currentReactions
      };
    }));
  };

  // EDIT MESSAGE
  const handleEditMessage = async (messageId: string, newText: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true, editTimestamp: 'Just now' } : m));
    showNativeToast('Message edited');
  };

  // DELETE FOR ME
  const handleDeleteForMe = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deletedForMe: true } : m));
    showNativeToast('Message removed for you');
  };

  // DELETE FOR EVERYONE
  const handleDeleteForEveryone = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? {
      ...m,
      text: '🚫 This message was deleted',
      deletedForEveryone: true,
      imageUrl: undefined,
      isImage: false,
      isAudio: false,
      isVideo: false
    } : m));
    showNativeToast('Message deleted for everyone');
  };

  // FORWARD MESSAGE
  const handleForwardMessage = (targetMatchId: string, msg: Message) => {
    const forwarded: Message = {
      id: `msg_fwd_${Date.now()}`,
      matchId: targetMatchId,
      senderId: 'user_me',
      senderName: 'You',
      text: msg.text || '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isImage: msg.isImage,
      imageUrl: msg.imageUrl,
      isAudio: msg.isAudio,
      audioUrl: msg.audioUrl,
      isVideo: msg.isVideo,
      videoUrl: msg.videoUrl
    };

    setMatches(prev => prev.map(m => m.id === targetMatchId ? { ...m, lastMessage: forwarded.text || 'Forwarded media', lastMessageTime: 'Just now' } : m));
  };

  // DATE INVITE RESPONSE (Accept / Decline)
  const handleDateInviteResponse = (messageId: string, status: 'accepted' | 'declined') => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId && m.dateInvite) {
        return {
          ...m,
          dateInvite: {
            ...m.dateInvite,
            status
          }
        };
      }
      return m;
    }));

    if (status === 'accepted') {
      triggerHaptic('success');
      showNativeToast('Date accepted! Have an unforgettable time! 🍸');
    }
  };

  // CALL HANDLERS
  const handleEndCall = (durationSeconds: number, status: 'completed' | 'missed' | 'declined') => {
    if (activeMatch) {
      const callEventMsg: Message = {
        id: `call_${Date.now()}`,
        matchId: activeMatch.id,
        senderId: 'user_me',
        senderName: 'You',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        isCallEvent: true,
        callEvent: {
          type: activeCall?.type || 'voice',
          status,
          durationSeconds: durationSeconds > 0 ? durationSeconds : undefined
        }
      };
      setMessages(prev => [...prev, callEventMsg]);
    }
    setActiveCall(null);
  };

  // SAFETY ACTIONS
  const handleBlockUser = async () => {
    if (!activeMatch) return;
    try {
      await fetch('/api/chat/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeMatch.user.id })
      });
    } catch {}
    setMatches(prev => prev.filter(m => m.id !== activeMatch.id));
    setActiveMatch(null);
    setShowBlockModal(false);
    showNativeToast(`${activeMatch.user.name} has been blocked.`);
  };

  const handleUnmatchUser = () => {
    if (!activeMatch) return;
    setMatches(prev => prev.filter(m => m.id !== activeMatch.id));
    setActiveMatch(null);
    setShowUnmatchModal(false);
    showNativeToast(`Unmatched with ${activeMatch.user.name}.`);
  };

  const handleReport = async (reason: string, details: string) => {
    if (!activeMatch) return;
    try {
      await fetch('/api/chat/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeMatch.user.id,
          messageId: reportingMessage?.id,
          reason,
          details
        })
      });
    } catch {}
    onReportProfile(activeMatch.user);
    setShowReportModal(false);
    setReportingMessage(null);
  };

  // CONVERSATION ACTIONS (Pin, Mute, Clear)
  const handleTogglePin = (matchId: string) => {
    triggerHaptic('light');
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, isPinned: !m.isPinned } : m));
    showNativeToast('Conversation pin updated');
  };

  const handleToggleMute = (matchId: string) => {
    triggerHaptic('light');
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, isMuted: !m.isMuted } : m));
    showNativeToast('Notification mute settings updated');
  };

  const handleClearHistory = () => {
    triggerHaptic('medium');
    setMessages([]);
    showNativeToast('Chat history cleared');
  };

  // IF NO CHAT SELECTED -> SHOW FULL CONVERSATION LIST
  if (!activeMatch) {
    return (
      <div className="flex-1 h-[calc(100vh-120px)] max-w-4xl mx-auto w-full">
        <ConversationList
          matches={matches}
          selectedMatchId={null}
          onSelectMatch={(m) => setActiveMatch(m)}
          onTogglePin={handleTogglePin}
          onToggleMute={handleToggleMute}
          onMarkRead={(id) => setMatches(prev => prev.map(m => m.id === id ? { ...m, unreadCount: 0 } : m))}
          onDeleteMatch={(id) => setMatches(prev => prev.filter(m => m.id !== id))}
          onOpenMatchProfile={(user) => {
            const found = matches.find(m => m.user.id === user.id);
            if (found) {
              setActiveMatch(found);
              setShowProfileDrawer(true);
            }
          }}
        />
      </div>
    );
  }

  // ACTIVE CONVERSATION FULL VIEW
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto w-full bg-[#0e0f11] text-white relative overflow-hidden border-x border-white/5 shadow-2xl">
      
      {/* 1. Modern Conversation Header */}
      <ChatHeader
        match={activeMatch}
        onBack={() => setActiveMatch(null)}
        onVoiceCall={() => setActiveCall({ type: 'voice' })}
        onVideoCall={() => setActiveCall({ type: 'video' })}
        onOpenSearch={() => setShowSearch(true)}
        onOpenDateIdeas={() => setShowDateIdeasModal(true)}
        onOpenProfileDrawer={() => setShowProfileDrawer(true)}
        onTogglePin={() => handleTogglePin(activeMatch.id)}
        onToggleMute={() => handleToggleMute(activeMatch.id)}
        onClearHistory={handleClearHistory}
        onUnmatch={() => setShowUnmatchModal(true)}
        onBlock={() => setShowBlockModal(true)}
        onReport={() => setShowReportModal(true)}
      />

      {/* 2. In-Chat Search Bar */}
      {showSearch && (
        <ChatSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          resultCount={searchMatchesIndexes.length}
          currentResultIndex={currentSearchIndex}
          onPrevResult={() => {
            const prev = (currentSearchIndex - 1 + searchMatchesIndexes.length) % searchMatchesIndexes.length;
            setCurrentSearchIndex(prev);
            scrollToMessageId(messages[searchMatchesIndexes[prev]].id);
          }}
          onNextResult={() => {
            const next = (currentSearchIndex + 1) % searchMatchesIndexes.length;
            setCurrentSearchIndex(next);
            scrollToMessageId(messages[searchMatchesIndexes[next]].id);
          }}
          onClose={() => {
            setShowSearch(false);
            setSearchQuery('');
          }}
        />
      )}

      {/* 3. Messages Feed Scrollable Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10"
      >
        {/* Match Header Hero Card */}
        <div className="text-center my-6 space-y-2 select-none">
          <div className="relative inline-block">
            <img
              src={activeMatch.user.photos[0]}
              alt={activeMatch.user.name}
              onClick={() => setShowProfileDrawer(true)}
              className="w-20 h-20 rounded-full mx-auto object-cover ring-4 ring-rose-500/80 shadow-2xl cursor-pointer hover:scale-105 transition-transform"
            />
            <div className="absolute -bottom-1 -right-1 p-1 bg-[#0e0f11] rounded-full">
              <span className="w-3 h-3 bg-emerald-500 rounded-full block" />
            </div>
          </div>

          <div>
            <h3 className="font-extrabold text-base text-white flex items-center justify-center gap-1.5">
              <span>You matched with {activeMatch.user.name}</span>
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Matched {activeMatch.matchedAt} • {activeMatch.user.compatibilityScore}% Compatibility
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setShowDateIdeasModal(true)}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>Explore First Date Ideas 🍸</span>
            </button>
            <button
              onClick={() => setShowProfileDrawer(true)}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 transition-colors"
            >
              <span>View Profile</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-500 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Messages are end-to-end encrypted & verified by CREST</span>
          </div>
        </div>

        {/* Render Messages */}
        {messages.map((message, idx) => {
          const isMe = message.senderId === 'user_me';
          const prevMsg = messages[idx - 1];
          const nextMsg = messages[idx + 1];

          const isFirstInGroup = !prevMsg || prevMsg.senderId !== message.senderId;
          const isLastInGroup = !nextMsg || nextMsg.senderId !== message.senderId;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isMe={isMe}
              matchUser={activeMatch.user}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              searchHighlight={searchQuery}
              isHighlighted={highlightedMessageId === message.id}
              onReply={(msg) => setReplyingTo(msg)}
              onReact={handleReact}
              onEdit={handleEditMessage}
              onDeleteForMe={handleDeleteForMe}
              onDeleteForEveryone={handleDeleteForEveryone}
              onForward={(msg) => setForwardingMessage(msg)}
              onReport={(msg) => {
                setReportingMessage(msg);
                setShowReportModal(true);
              }}
              onOpenLightbox={(url, type, caption) => setLightboxMedia({ url, type, caption })}
              onDateInviteResponse={handleDateInviteResponse}
              onScrollToMessage={scrollToMessageId}
              onRetryFailedMessage={(msg) => handleSendMessage(msg.text || '')}
            />
          );
        })}

        {/* Typing indicator bubble */}
        {activeMatch.isTyping && (
          <div className="flex items-center gap-2 my-1 animate-in fade-in">
            <img
              src={activeMatch.user.photos[0]}
              alt=""
              className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
            />
            <div className="bg-[#1e2024] border border-white/10 px-3.5 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottomBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-5 z-20 p-2.5 rounded-full bg-[#18191c]/90 border border-white/20 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all backdrop-blur-md"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* 4. Chat Composer */}
      <ChatComposer
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSendMessage={handleSendMessage}
        onSendMedia={handleSendMedia}
        onSendVoiceNote={handleSendVoiceNote}
        onSendDateInvite={handleSendDateInvite}
        onTyping={(typing) => {
          // Send typing indicator to backend
        }}
        onOpenDateIdeas={() => setShowDateIdeasModal(true)}
      />

      {/* 5. Modals and Overlays */}
      {/* Lightbox */}
      {lightboxMedia && (
        <MediaLightbox
          mediaUrl={lightboxMedia.url}
          mediaType={lightboxMedia.type}
          caption={lightboxMedia.caption}
          senderName={activeMatch.user.name}
          onClose={() => setLightboxMedia(null)}
        />
      )}

      {/* Voice & Video Call Modal */}
      {activeCall && (
        <ActiveCallModal
          callType={activeCall.type}
          user={activeMatch.user}
          isIncoming={activeCall.isIncoming}
          onEndCall={handleEndCall}
        />
      )}

      {/* User Profile Slide-over Drawer */}
      {showProfileDrawer && (
        <UserProfileDrawer
          user={activeMatch.user}
          onClose={() => setShowProfileDrawer(false)}
          onOpenDateIdeas={() => setShowDateIdeasModal(true)}
          onUnmatch={() => setShowUnmatchModal(true)}
          onBlock={() => setShowBlockModal(true)}
          onReport={() => setShowReportModal(true)}
        />
      )}

      {/* AI First Date Ideas Modal */}
      {showDateIdeasModal && (
        <DateIdeasModal
          user={activeMatch.user}
          onSendDateInvite={handleSendDateInvite}
          onClose={() => setShowDateIdeasModal(false)}
        />
      )}

      {/* Block Confirmation Modal */}
      {showBlockModal && (
        <BlockConfirmModal
          user={activeMatch.user}
          onConfirmBlock={handleBlockUser}
          onClose={() => setShowBlockModal(false)}
        />
      )}

      {/* Unmatch Confirmation Modal */}
      {showUnmatchModal && (
        <UnmatchConfirmModal
          user={activeMatch.user}
          onConfirmUnmatch={handleUnmatchUser}
          onClose={() => setShowUnmatchModal(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          user={activeMatch.user}
          message={reportingMessage}
          onSubmitReport={handleReport}
          onClose={() => {
            setShowReportModal(false);
            setReportingMessage(null);
          }}
        />
      )}

      {/* Forward Message Modal */}
      {forwardingMessage && (
        <ForwardModal
          message={forwardingMessage}
          matches={matches.filter(m => m.id !== activeMatch.id)}
          onForward={handleForwardMessage}
          onClose={() => setForwardingMessage(null)}
        />
      )}
    </div>
  );
};
