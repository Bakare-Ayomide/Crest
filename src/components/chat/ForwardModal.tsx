import React, { useState } from 'react';
import { X, Search, Check, Send } from 'lucide-react';
import { Match, Message } from '../../types';
import { triggerHaptic, showNativeToast } from '../../lib/capacitor';

interface ForwardModalProps {
  message: Message;
  matches: Match[];
  onForward: (targetMatchId: string, message: Message) => void;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({ message, matches, onForward, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);

  const filtered = matches.filter(m => m.user.name.toLowerCase().includes(search.toLowerCase()));

  const toggleSelect = (id: string) => {
    triggerHaptic('light');
    setSelectedMatchIds(prev =>
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleSendForward = () => {
    triggerHaptic('success');
    selectedMatchIds.forEach(id => {
      onForward(id, message);
    });
    showNativeToast(`Forwarded to ${selectedMatchIds.length} match${selectedMatchIds.length > 1 ? 'es' : ''}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-white animate-in fade-in duration-150">
      <div className="bg-[#18191c] border border-white/10 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-extrabold text-base">Forward Message</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-xs text-gray-300">
          <p className="font-bold text-gray-400 text-[10px] uppercase mb-1">Preview</p>
          <p className="line-clamp-2">{message.text || (message.isImage ? '📷 Photo' : message.isAudio ? '🎤 Voice Note' : 'Attachment')}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search matches..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        {/* Matches List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-60">
          {filtered.map(match => {
            const isSelected = selectedMatchIds.includes(match.id);
            return (
              <div
                key={match.id}
                onClick={() => toggleSelect(match.id)}
                className={`p-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-rose-500/20 border border-rose-500/40' : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img src={match.user.photos[0]} alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h5 className="font-bold text-xs text-white">{match.user.name}</h5>
                    <p className="text-[10px] text-gray-400">{match.user.locationName}</p>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                  isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-white/20'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendForward}
          disabled={selectedMatchIds.length === 0}
          className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
            selectedMatchIds.length > 0
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:scale-102'
              : 'bg-white/10 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4 fill-current" />
          <span>Forward ({selectedMatchIds.length})</span>
        </button>
      </div>
    </div>
  );
};
