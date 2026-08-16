import React, { useState, useRef, useEffect } from 'react';
import { 
  Check, CheckCheck, Clock, AlertCircle, Play, Pause, Download, 
  CornerUpLeft, Copy, Edit2, Trash2, ShieldAlert, Share2, 
  ExternalLink, Phone, Video, Compass, FileText, Sparkles, Smile, RefreshCw
} from 'lucide-react';
import { Message, MessageReaction, UserProfile } from '../../types';
import { triggerHaptic, showNativeToast } from '../../lib/capacitor';
import { isValidAudioUrl, VoiceNoteSynthesizer } from '../../lib/audioUtils';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  matchUser: UserProfile;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  searchHighlight?: string;
  isHighlighted?: boolean;
  onReply: (message: Message) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, newText: string) => void;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  onForward: (message: Message) => void;
  onReport: (message: Message) => void;
  onOpenLightbox: (url: string, type: 'image' | 'video', caption?: string) => void;
  onDateInviteResponse?: (messageId: string, status: 'accepted' | 'declined') => void;
  onScrollToMessage?: (messageId: string) => void;
  onRetryFailedMessage?: (message: Message) => void;
}

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '😢', '👍'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  matchUser,
  isFirstInGroup,
  isLastInGroup,
  searchHighlight,
  isHighlighted,
  onReply,
  onReact,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onForward,
  onReport,
  onOpenLightbox,
  onDateInviteResponse,
  onScrollToMessage,
  onRetryFailedMessage
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  // Audio Playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<VoiceNoteSynthesizer | null>(null);

  // Context Menu position
  const bubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (message.isAudio && isValidAudioUrl(message.audioUrl)) {
      try {
        const audio = new Audio(message.audioUrl);
        audio.playbackRate = audioSpeed;
        
        audio.ontimeupdate = () => {
          if (audioRef.current && audioRef.current.duration) {
            setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
          }
        };

        audio.onended = () => {
          setIsPlayingAudio(false);
          setAudioProgress(0);
        };

        audio.onerror = () => {
          // Fallback if media loading fails
          audioRef.current = null;
        };

        audioRef.current = audio;
      } catch {
        audioRef.current = null;
      }
    } else {
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, [message.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = audioSpeed;
    }
  }, [audioSpeed]);

  if (message.deletedForMe) return null;

  const togglePlayAudio = () => {
    triggerHaptic('light');

    if (isPlayingAudio) {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
      }
      if (synthRef.current) {
        synthRef.current.stop();
      }
      setIsPlayingAudio(false);
      return;
    }

    // Try HTML5 Audio
    if (audioRef.current && isValidAudioUrl(message.audioUrl)) {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        // If playback failed, use tone synthesizer
        playWithSynthesizer();
      });
    } else {
      playWithSynthesizer();
    }
  };

  const playWithSynthesizer = () => {
    if (!synthRef.current) {
      synthRef.current = new VoiceNoteSynthesizer();
    }
    setIsPlayingAudio(true);
    const duration = message.audioDuration ? parseInt(message.audioDuration.split(':')[1] || '3', 10) : 3;
    synthRef.current.play(
      Math.max(2, duration),
      (pct) => setAudioProgress(pct),
      () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      }
    );
  };

  const handleCopyText = () => {
    triggerHaptic('light');
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      showNativeToast('Text copied to clipboard');
    }
    setShowActionMenu(false);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    triggerHaptic('success');
    onEdit(message.id, editText.trim());
    setIsEditing(false);
    setShowActionMenu(false);
  };

  const handleToggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const nextSpeed = audioSpeed === 1 ? 1.5 : audioSpeed === 1.5 ? 2 : 1;
    setAudioSpeed(nextSpeed);
  };

  const handleScrubWaveform = (barIndex: number, totalBars: number) => {
    triggerHaptic('light');
    const targetPercent = (barIndex / (totalBars - 1)) * 100;
    setAudioProgress(targetPercent);

    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (targetPercent / 100) * audioRef.current.duration;
      if (!isPlayingAudio) {
        audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
      }
    }
  };

  // Render Highlighted Search Text
  const renderFormattedText = (text: string) => {
    if (!searchHighlight || !text) return text;
    const parts = text.split(new RegExp(`(${searchHighlight})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchHighlight.toLowerCase() ? (
        <mark key={i} className="bg-amber-400 text-black px-0.5 rounded-xs font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // CALL EVENT BUBBLE
  if (message.isCallEvent && message.callEvent) {
    const isMissed = message.callEvent.status === 'missed' || message.callEvent.status === 'declined';
    return (
      <div className="flex justify-center my-2 text-xs">
        <div className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-gray-300 shadow-xs">
          {message.callEvent.type === 'video' ? (
            <Video className={`w-3.5 h-3.5 ${isMissed ? 'text-red-400' : 'text-emerald-400'}`} />
          ) : (
            <Phone className={`w-3.5 h-3.5 ${isMissed ? 'text-red-400' : 'text-emerald-400'}`} />
          )}
          <span className="font-medium">
            {isMissed ? 'Missed Call' : `${message.callEvent.type === 'video' ? 'Video' : 'Voice'} Call`}
            {message.callEvent.durationSeconds ? ` • ${Math.floor(message.callEvent.durationSeconds / 60)}m ${message.callEvent.durationSeconds % 60}s` : ''}
          </span>
          <span className="text-[10px] text-gray-500">{message.timestamp}</span>
        </div>
      </div>
    );
  }

  // TAILORED CORNER RADII FOR GROUPED CONVERSATIONS
  const bubbleCorners = isMe
    ? `${isFirstInGroup ? 'rounded-t-2xl' : 'rounded-tr-md rounded-tl-2xl'} ${
        isLastInGroup ? 'rounded-b-2xl rounded-br-xs' : 'rounded-br-md rounded-bl-2xl'
      }`
    : `${isFirstInGroup ? 'rounded-t-2xl' : 'rounded-tl-md rounded-tr-2xl'} ${
        isLastInGroup ? 'rounded-b-2xl rounded-bl-xs' : 'rounded-bl-md rounded-br-2xl'
      }`;

  return (
    <div
      id={`msg-${message.id}`}
      ref={bubbleRef}
      className={`group relative flex flex-col my-0.5 transition-all duration-300 ${
        isMe ? 'items-end' : 'items-start'
      } ${isHighlighted ? 'ring-2 ring-rose-500 rounded-2xl p-1 bg-rose-500/10' : ''}`}
    >
      <div className={`flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Match Avatar (only on last message of group if not me) */}
        {!isMe && (
          <div className="w-7 h-7 flex-shrink-0">
            {isLastInGroup ? (
              <img
                src={matchUser.photos[0]}
                alt={matchUser.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-7" />
            )}
          </div>
        )}

        {/* Bubble Box */}
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            triggerHaptic('medium');
            setShowActionMenu(true);
          }}
          className={`relative px-3.5 py-2.5 shadow-sm text-sm break-words transition-all ${bubbleCorners} ${
            isMe
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-500/10'
              : 'bg-[#1e2024] border border-white/10 text-gray-100'
          }`}
        >
          {/* Quoted Reply Header */}
          {message.replyTo && (
            <div
              onClick={() => onScrollToMessage?.(message.replyTo!.id)}
              className={`p-2 rounded-xl mb-2 text-xs cursor-pointer border-l-3 transition-opacity hover:opacity-90 ${
                isMe
                  ? 'bg-black/20 border-white text-white/90'
                  : 'bg-white/5 border-rose-500 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[10px] uppercase opacity-80">
                <CornerUpLeft className="w-3 h-3" />
                <span>{message.replyTo.senderName}</span>
              </div>
              <p className="line-clamp-1 text-xs mt-0.5 font-medium">{message.replyTo.text}</p>
            </div>
          )}

          {/* IMAGE MESSAGE */}
          {message.isImage && message.imageUrl && (
            <div className="rounded-xl overflow-hidden mb-1 cursor-pointer group/img relative">
              <img
                src={message.imageUrl}
                alt={message.imageCaption || 'Photo'}
                onClick={() => onOpenLightbox(message.imageUrl!, 'image', message.imageCaption || message.text)}
                className="max-h-64 w-full object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-102"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox(message.imageUrl!, 'image', message.imageCaption || message.text);
                }}
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* VIDEO MESSAGE */}
          {message.isVideo && message.videoUrl && (
            <div className="rounded-xl overflow-hidden mb-1 relative bg-black">
              <video
                src={message.videoUrl}
                controls
                className="max-h-64 w-full rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* VOICE NOTE MESSAGE */}
          {message.isAudio && (
            <div className="flex items-center gap-3 py-1 min-w-[210px] sm:min-w-[240px]">
              <button
                onClick={togglePlayAudio}
                className={`p-2.5 rounded-full flex items-center justify-center transition-all ${
                  isMe ? 'bg-white text-rose-500 hover:bg-white/90 shadow-md' : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="flex-1">
                {/* Waveform Scrubber */}
                <div className="flex items-center gap-0.5 h-7 cursor-pointer group py-1" title="Click to seek">
                  {((message.audioWaveform && message.audioWaveform.length > 0)
                    ? message.audioWaveform
                    : [30, 50, 80, 40, 95, 60, 45, 70, 85, 40, 65, 50, 75, 90, 30]
                  ).map((lvl, i, arr) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScrubWaveform(i, arr.length);
                      }}
                      className={`w-1 rounded-full transition-all duration-100 hover:scale-y-125 cursor-pointer ${
                        isMe
                          ? (i / arr.length) * 100 <= audioProgress ? 'bg-white' : 'bg-white/40'
                          : (i / arr.length) * 100 <= audioProgress ? 'bg-rose-500' : 'bg-white/25'
                      }`}
                      style={{ height: `${Math.max(20, lvl)}%` }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono mt-1 opacity-90">
                  <span>{message.audioDuration || '0:14'}</span>
                  <button
                    onClick={handleToggleSpeed}
                    className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                      isMe ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    {audioSpeed}x
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FILE ATTACHMENT */}
          {message.isFile && message.fileUrl && (
            <div className={`p-2.5 rounded-xl flex items-center gap-3 mb-1 ${
              isMe ? 'bg-black/20 text-white' : 'bg-white/5 text-gray-200'
            }`}>
              <div className="p-2 rounded-lg bg-rose-500 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs truncate">{message.fileName || 'Attachment'}</p>
                <p className="text-[10px] opacity-75">{message.fileSize || '1.2 MB'}</p>
              </div>
              <a
                href={message.fileUrl}
                download={message.fileName || 'file'}
                className="p-1.5 rounded-lg hover:bg-white/10 text-current"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* DATE INVITE INTERACTIVE CARD */}
          {message.isDateInvite && message.dateInvite && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-pink-500/20 border border-amber-400/40 space-y-2.5 text-white my-1">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wide">
                <Compass className="w-4 h-4" />
                <span>First Date Proposal 🍸</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white">{message.dateInvite.title}</h4>
                <p className="text-xs text-amber-200/90 mt-0.5">
                  {message.dateInvite.vibe} • {message.dateInvite.activity}
                </p>
                <p className="text-[11px] text-gray-300 mt-1">📍 {message.dateInvite.location}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                {message.dateInvite.status === 'accepted' ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Date Accepted! 🥂
                  </span>
                ) : message.dateInvite.status === 'declined' ? (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-gray-400 font-medium text-[11px]">
                    Invite Passed
                  </span>
                ) : !isMe ? (
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => onDateInviteResponse?.(message.id, 'accepted')}
                      className="flex-1 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-xl shadow-sm hover:scale-102 transition-transform"
                    >
                      Accept Date 🎉
                    </button>
                    <button
                      onClick={() => onDateInviteResponse?.(message.id, 'declined')}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-semibold rounded-xl"
                    >
                      Maybe Later
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-amber-300 italic">
                    Waiting for {matchUser.name} to respond...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TEXT MESSAGE BODY */}
          {isEditing ? (
            <div className="space-y-2 min-w-[200px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full p-2 bg-black/40 border border-white/20 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-xs text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold text-xs shadow-xs"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            message.text && (
              <p className="leading-relaxed whitespace-pre-wrap select-text">
                {renderFormattedText(message.text)}
              </p>
            )
          )}

          {/* URL RICH PREVIEW CARD */}
          {message.urlPreview && (
            <a
              href={message.urlPreview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block p-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/10 transition-colors text-left"
            >
              {message.urlPreview.image && (
                <img
                  src={message.urlPreview.image}
                  alt=""
                  className="w-full h-28 object-cover rounded-lg mb-2"
                />
              )}
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                <ExternalLink className="w-2.5 h-2.5" />
                {message.urlPreview.domain}
              </p>
              <h5 className="font-bold text-xs text-white mt-0.5 line-clamp-1">
                {message.urlPreview.title}
              </h5>
              <p className="text-[11px] text-gray-300 mt-0.5 line-clamp-2">
                {message.urlPreview.description}
              </p>
            </a>
          )}

          {/* TIMESTAMP & STATUS CHECKMARKS */}
          <div
            className={`flex items-center gap-1 text-[10px] mt-1 select-none ${
              isMe ? 'text-white/80 justify-end' : 'text-gray-400 justify-end'
            }`}
          >
            {message.isEdited && <span className="italic mr-1">(edited)</span>}
            <span>{message.timestamp}</span>

            {isMe && (
              <span className="ml-0.5 flex items-center">
                {message.status === 'sending' && (
                  <Clock className="w-3 h-3 text-white/60 animate-spin" />
                )}
                {message.status === 'sent' && (
                  <Check className="w-3.5 h-3.5 text-white/80" />
                )}
                {message.status === 'delivered' && (
                  <CheckCheck className="w-3.5 h-3.5 text-white/80" />
                )}
                {message.status === 'read' && (
                  <CheckCheck className="w-3.5 h-3.5 text-rose-200 stroke-[2.5]" />
                )}
                {message.status === 'failed' && (
                  <button
                    onClick={() => onRetryFailedMessage?.(message)}
                    className="flex items-center gap-0.5 text-red-300 font-bold hover:underline"
                    title="Retry Sending"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Retry</span>
                  </button>
                )}
              </span>
            )}
          </div>

          {/* EMOJI REACTIONS ROW */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5 -mb-1">
              {message.reactions.map((r, i) => {
                const isReactedByMe = r.userIds.includes('user_me');
                return (
                  <button
                    key={i}
                    onClick={() => onReact(message.id, r.emoji)}
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                      isReactedByMe
                        ? 'bg-rose-500 text-white shadow-xs scale-105'
                        : 'bg-black/30 text-gray-200 hover:bg-black/50 border border-white/10'
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="text-[10px]">{r.userIds.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* HOVER QUICK ACTION TOOLBAR (DESKTOP & TOUCH MENU TRIGGER) */}
        <div className={`opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 ${
          isMe ? 'flex-row-reverse' : 'flex-row'
        }`}>
          {/* Quick Reaction Bar */}
          <div className="flex items-center bg-[#18191c]/90 border border-white/10 rounded-full px-1.5 py-0.5 shadow-lg backdrop-blur-xs">
            {QUICK_REACTIONS.slice(0, 3).map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  triggerHaptic('light');
                  onReact(message.id, emoji);
                }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:scale-125 transition-transform text-xs"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
              title="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reply Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onReply(message);
            }}
            className="p-1.5 rounded-full bg-[#18191c]/90 hover:bg-white/20 text-gray-300 hover:text-white border border-white/10 shadow-md transition-colors"
            title="Reply"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* REACTION PICKER POPUP */}
      {showReactionPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowReactionPicker(false)} />
          <div className={`absolute z-50 bottom-full mb-1 flex items-center gap-1 p-1.5 bg-[#18191c] border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in-95 ${
            isMe ? 'right-0' : 'left-0'
          }`}>
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  triggerHaptic('light');
                  onReact(message.id, emoji);
                  setShowReactionPicker(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/10 text-base hover:scale-120 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {/* CONTEXT ACTION MENU */}
      {showActionMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />
          <div className={`absolute z-50 top-full mt-1 w-48 bg-[#1a1c20] border border-white/10 rounded-2xl shadow-2xl p-1 text-xs text-gray-200 animate-in fade-in zoom-in-95 ${
            isMe ? 'right-0' : 'left-0'
          }`}>
            <button
              onClick={() => {
                setShowActionMenu(false);
                onReply(message);
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
            >
              <CornerUpLeft className="w-4 h-4 text-gray-300" />
              <span>Reply</span>
            </button>

            {message.text && (
              <button
                onClick={handleCopyText}
                className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
              >
                <Copy className="w-4 h-4 text-gray-300" />
                <span>Copy Text</span>
              </button>
            )}

            {isMe && message.text && !message.deletedForEveryone && (
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setIsEditing(true);
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
              >
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Message</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowActionMenu(false);
                onForward(message);
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>Forward Message</span>
            </button>

            <div className="h-px bg-white/10 my-1" />

            <button
              onClick={() => {
                setShowActionMenu(false);
                onDeleteForMe(message.id);
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2 text-left text-gray-400"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete for Me</span>
            </button>

            {isMe && !message.deletedForEveryone && (
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  onDeleteForEveryone(message.id);
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-left"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete for Everyone</span>
              </button>
            )}

            {!isMe && (
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  onReport(message);
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 flex items-center gap-2 text-left"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Report Inappropriate</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
