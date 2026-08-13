import React, { useState } from 'react';
import { Smile, Heart, ThumbsUp, Flame, Coffee, Sparkles, Music, Star, Search, X } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'dating',
    name: 'Dating & Romance',
    icon: '❤️',
    emojis: ['❤️', '💖', '🔥', '✨', '😍', '🥰', '😘', '🌹', '🥂', '🍸', '☕', '💋', '💌', '💍', '💐', '💘', '💕', '😻']
  },
  {
    id: 'smileys',
    name: 'Smileys & Expressions',
    icon: '😊',
    emojis: ['😊', '😂', '🤣', '😉', '😎', '😜', '😇', '🥳', '🤩', '🥺', '😏', '😌', '🤔', '🤫', '🤭', '😴', '🤤', '🤯']
  },
  {
    id: 'gestures',
    name: 'Gestures & People',
    icon: '👋',
    emojis: ['👋', '🙌', '👏', '👍', '✌️', '🤞', '🫶', '💃', '🕺', '🏄‍♂️', '🧘‍♀️', '🏃‍♂️', '🙆‍♀️', '🙋‍♂️', '🤝', '👊', '👀', '🤙']
  },
  {
    id: 'activities',
    name: 'Food & Vibes',
    icon: '🍕',
    emojis: ['🍕', '🍣', '🌮', '🍝', '🍦', '🍩', '🥑', '🍷', '🍺', '🏖️', '✈️', '🌴', '🎧', '🎸', '📸', '🎨', '🍿', '🏎️']
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: '⭐',
    emojis: ['⭐', '🌟', '💫', '⚡', '💯', '🔥', '🎉', '🎊', '🎈', '🏆', '💎', '🌙', '☀️', '🌈', '🔮', '🧸', '🎁', '🪄']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('dating');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crest_recent_emojis');
      return saved ? JSON.parse(saved) : ['❤️', '🔥', '✨', '😍', '🥂', '😊', '☕', '🙌'];
    } catch {
      return ['❤️', '🔥', '✨', '😍', '🥂', '😊', '☕', '🙌'];
    }
  });

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);
    const updated = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 16);
    setRecentEmojis(updated);
    try {
      localStorage.setItem('crest_recent_emojis', JSON.stringify(updated));
    } catch {}
  };

  const allFilteredEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter((emoji, idx, self) => self.indexOf(emoji) === idx)
    : [];

  return (
    <div className="bg-[#18191b] border border-white/10 rounded-2xl shadow-2xl p-3 w-80 max-w-full text-white z-50 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
      {/* Header & Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <button
            onClick={() => setActiveCategory('recent')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeCategory === 'recent' ? 'bg-rose-500/20 text-rose-400' : 'text-gray-400 hover:text-white'
            }`}
            title="Recent"
          >
            🕒
          </button>
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-1.5 rounded-lg text-sm transition-colors ${
                activeCategory === cat.id ? 'bg-rose-500/20 text-rose-400' : 'text-gray-400 hover:text-white'
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
        {searchQuery ? (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Results
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {allFilteredEmojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(emoji)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-lg transition-transform hover:scale-120 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : activeCategory === 'recent' ? (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Recently Used
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {recentEmojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(emoji)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-lg transition-transform hover:scale-120 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              {EMOJI_CATEGORIES.find(c => c.id === activeCategory)?.name}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {EMOJI_CATEGORIES.find(c => c.id === activeCategory)?.emojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(emoji)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 text-lg transition-transform hover:scale-120 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
