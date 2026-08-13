import React from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { triggerHaptic } from '../../lib/capacitor';

interface ChatSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  resultCount: number;
  currentResultIndex: number;
  onPrevResult: () => void;
  onNextResult: () => void;
  onClose: () => void;
}

export const ChatSearch: React.FC<ChatSearchProps> = ({
  searchQuery,
  onSearchChange,
  resultCount,
  currentResultIndex,
  onPrevResult,
  onNextResult,
  onClose
}) => {
  return (
    <div className="bg-[#141517] border-b border-white/10 px-3 py-2 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150 text-white z-20">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search this conversation..."
          className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          autoFocus
        />
      </div>

      {searchQuery && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
          <span>
            {resultCount > 0 ? `${currentResultIndex + 1}/${resultCount}` : '0 results'}
          </span>

          <button
            onClick={() => {
              triggerHaptic('light');
              onPrevResult();
            }}
            disabled={resultCount === 0}
            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 text-gray-300"
            title="Previous match"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onNextResult();
            }}
            disabled={resultCount === 0}
            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 text-gray-300"
            title="Next match"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      <button
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
