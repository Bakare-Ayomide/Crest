import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Image, Mic, Paperclip, Smile, X, CornerUpLeft, 
  Sparkles, Compass, Coffee, Music, Camera, FileText, Check
} from 'lucide-react';
import { Message, ReplyReference, DateInviteData } from '../../types';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { triggerHaptic, showNativeToast } from '../../lib/capacitor';

interface ChatComposerProps {
  replyingTo: Message | null;
  onCancelReply: () => void;
  onSendMessage: (text: string) => void;
  onSendMedia: (file: File, type: 'image' | 'video' | 'file', caption?: string) => void;
  onSendVoiceNote: (audioUrl: string, duration: string, waveform: number[]) => void;
  onSendDateInvite: (dateData: DateInviteData) => void;
  onTyping: (isTyping: boolean) => void;
  onOpenDateIdeas: () => void;
  disabled?: boolean;
}

const CONVERSATION_SPARKS = [
  { label: 'Suggest coffee ☕', prompt: 'Hey! Know any cute coffee spots around here we could check out?' },
  { label: 'Ask about passions 🎨', prompt: "I saw you're into that! What got you started?" },
  { label: 'Weekend vibe ✨', prompt: 'What does your ideal Saturday look like?' },
  { label: 'Favorite food 🍕', prompt: 'If you had to pick one food to eat for the rest of your life, what is it?' }
];

export const ChatComposer: React.FC<ChatComposerProps> = ({
  replyingTo,
  onCancelReply,
  onSendMessage,
  onSendMedia,
  onSendVoiceNote,
  onSendDateInvite,
  onTyping,
  onOpenDateIdeas,
  disabled = false
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File; previewUrl: string; type: 'image' | 'video' | 'file' } | null>(null);
  const [mediaCaption, setMediaCaption] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Focus on reply
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    // Typing debounce
    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    triggerHaptic('light');
    onSendMessage(text.trim());
    setText('');
    onTyping(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    triggerHaptic('light');
    setText(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isMediaOnly: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('medium');
    let type: 'image' | 'video' | 'file' = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';

    const previewUrl = URL.createObjectURL(file);
    setSelectedFile({ file, previewUrl, type });
    setShowAttachMenu(false);
    e.target.value = '';
  };

  const handleSendMediaFile = () => {
    if (!selectedFile) return;
    triggerHaptic('success');
    onSendMedia(selectedFile.file, selectedFile.type, mediaCaption.trim() || undefined);
    setSelectedFile(null);
    setMediaCaption('');
  };

  const handleCancelMedia = () => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.previewUrl);
      setSelectedFile(null);
      setMediaCaption('');
    }
  };

  // If in voice recorder mode, display recording console
  if (isRecordingVoice) {
    return (
      <div className="p-3 bg-[#141517] border-t border-white/10">
        <VoiceRecorder
          onSendVoiceNote={(audioUrl, duration, waveform) => {
            onSendVoiceNote(audioUrl, duration, waveform);
            setIsRecordingVoice(false);
          }}
          onCancel={() => setIsRecordingVoice(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#141517] border-t border-white/10 relative select-none">
      
      {/* File Upload Preview Dialog */}
      {selectedFile && (
        <div className="p-3 bg-[#18191c] border-b border-white/10 flex flex-col gap-2.5 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Ready to send {selectedFile.type}</span>
            </h5>
            <button
              onClick={handleCancelMedia}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3 items-center">
            {selectedFile.type === 'image' ? (
              <img
                src={selectedFile.previewUrl}
                alt=""
                className="w-16 h-16 rounded-xl object-cover border border-white/10 flex-shrink-0"
              />
            ) : selectedFile.type === 'video' ? (
              <video
                src={selectedFile.previewUrl}
                className="w-16 h-16 rounded-xl object-cover border border-white/10 flex-shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-rose-400">
                <FileText className="w-6 h-6" />
                <span className="text-[9px] text-gray-300 truncate max-w-[50px]">
                  {selectedFile.file.name}
                </span>
              </div>
            )}

            <div className="flex-1">
              <input
                type="text"
                value={mediaCaption}
                onChange={(e) => setMediaCaption(e.target.value)}
                placeholder="Add a caption... (optional)"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                autoFocus
              />
            </div>

            <button
              onClick={handleSendMediaFile}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl text-white text-xs font-bold shadow-lg hover:scale-102 transition-transform"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Replying Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-rose-400">Replying to {replyingTo.senderName || 'Message'}</span>
              <p className="text-[11px] text-gray-400 truncate">{replyingTo.text || 'Media Message'}</p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white ml-2 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Dating Spark chips */}
      {!text && !selectedFile && (
        <div className="px-3 pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400/80 flex items-center gap-1 flex-shrink-0 pr-1">
            <Sparkles className="w-3 h-3" /> Sparks:
          </span>
          {CONVERSATION_SPARKS.map((spark, idx) => (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic('light');
                setText(spark.prompt);
                if (textareaRef.current) textareaRef.current.focus();
              }}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-gray-300 hover:text-white flex-shrink-0 transition-colors"
            >
              {spark.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Row */}
      <div className="p-2.5 flex items-end gap-2 text-white">
        
        {/* Hidden File Inputs */}
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => handleFileChange(e, true)}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="*/*"
          onChange={(e) => handleFileChange(e, false)}
          className="hidden"
        />

        {/* Attachment Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowAttachMenu(!showAttachMenu);
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Attach media or date proposal"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Attachment Popup Menu */}
          {showAttachMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
              <div className="absolute bottom-full mb-2 left-0 w-56 bg-[#1c1e22] border border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-gray-200 animate-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    mediaInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-left"
                >
                  <Image className="w-4 h-4 text-pink-400" />
                  <span>Photos & Videos</span>
                </button>

                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-white/10 flex items-center gap-2.5 text-left"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Document / File</span>
                </button>

                <div className="h-px bg-white/10 my-1" />

                <button
                  onClick={() => {
                    setShowAttachMenu(false);
                    onOpenDateIdeas();
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-amber-500/20 text-amber-300 flex items-center gap-2.5 text-left font-semibold"
                >
                  <Compass className="w-4 h-4" />
                  <span>AI First Date Ideas</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Textarea Container */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-end px-3 py-1.5 focus-within:ring-1 focus-within:ring-rose-500/80 focus-within:border-rose-500/80 transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none resize-none max-h-32 py-1 leading-normal"
          />

          {/* Emoji Trigger */}
          <div className="relative mb-0.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full mb-3 right-0 z-50">
                <EmojiPicker
                  onSelectEmoji={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Voice Note or Send Button */}
        {text.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="p-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center flex-shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsRecordingVoice(true);
            }}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors flex-shrink-0"
            title="Record Voice Note"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
