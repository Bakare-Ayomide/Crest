import React, { useState } from 'react';
import { X, Compass, Sparkles, Send, Coffee, Wine, Palette, Trees, Gamepad2, MapPin, Check } from 'lucide-react';
import { UserProfile, DateInviteData } from '../../types';
import { triggerHaptic, showNativeToast } from '../../lib/capacitor';

interface DateIdeasModalProps {
  user: UserProfile;
  onSendDateInvite: (invite: DateInviteData) => void;
  onClose: () => void;
}

interface CuratedIdea {
  id: string;
  category: string;
  icon: string;
  title: string;
  vibe: string;
  activity: string;
  location: string;
}

export const DateIdeasModal: React.FC<DateIdeasModalProps> = ({ user, onSendDateInvite, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Dynamic customized date ideas based on match's interests
  const curatedIdeas: CuratedIdea[] = [
    {
      id: 'date-1',
      category: 'drinks',
      icon: '🍸',
      title: 'Hidden Speakeasy & Vinyl Listening',
      vibe: 'Intimate & Chic',
      activity: 'Craft botanical cocktails with jazz vinyl playing in the background',
      location: `${user.locationName} Downtown Arts District`
    },
    {
      id: 'date-2',
      category: 'coffee',
      icon: '☕',
      title: 'Artisanal Matcha & Bakery Stroll',
      vibe: 'Casual & Sweet',
      activity: 'Iced oat matchas, fresh cardamom buns, and walking by the local park',
      location: `${user.locationName} Old Town`
    },
    {
      id: 'date-3',
      category: 'active',
      icon: '🎯',
      title: 'Retro Arcade & Smash Burgers',
      vibe: 'Playful & High Energy',
      activity: 'Pinball tournaments, vintage Mario Kart duels, and double truffle burgers',
      location: `${user.locationName} Neon Quarter`
    },
    {
      id: 'date-4',
      category: 'culture',
      icon: '🎨',
      title: 'Late Night Museum & Gelato',
      vibe: 'Creative & Engaging',
      activity: 'Exploring contemporary installations during night hours followed by pistachio gelato',
      location: `${user.locationName} Modern Wing`
    },
    {
      id: 'date-5',
      category: 'outdoor',
      icon: '🌅',
      title: 'Sunset Skyline Lookout & Tapas',
      vibe: 'Scenic & Romantic',
      activity: 'Panoramic city views at golden hour with patatas bravas and sangria',
      location: `${user.locationName} Hilltop Terrace`
    }
  ];

  const filteredIdeas = selectedCategory === 'all'
    ? curatedIdeas
    : curatedIdeas.filter(i => i.category === selectedCategory);

  const handlePropose = (idea: CuratedIdea) => {
    triggerHaptic('success');
    onSendDateInvite({
      title: idea.title,
      vibe: idea.vibe,
      activity: idea.activity,
      location: idea.location,
      status: 'pending'
    });
    showNativeToast(`Date proposal sent to ${user.name}! 🍸`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-white animate-in fade-in duration-200">
      <div className="bg-[#18191c] border border-white/10 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-base">CREST AI First Date Planner</h3>
              <p className="text-[11px] text-gray-400">Curated suggestions for you and {user.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Vibes', icon: '✨' },
            { id: 'drinks', label: 'Drinks & Speakeasies', icon: '🍸' },
            { id: 'coffee', label: 'Cozy Coffee', icon: '☕' },
            { id: 'active', label: 'Fun & Games', icon: '🎯' },
            { id: 'culture', label: 'Art & Museums', icon: '🎨' },
            { id: 'outdoor', label: 'Sunsets & Views', icon: '🌅' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                triggerHaptic('light');
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Ideas List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[55vh]">
          {filteredIdeas.map(idea => (
            <div
              key={idea.id}
              className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 hover:border-amber-400/40 space-y-2.5 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{idea.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                      {idea.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-rose-400">{idea.vibe}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                {idea.activity}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{idea.location}</span>
                </div>

                <button
                  onClick={() => handlePropose(idea)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:scale-105 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-transform"
                >
                  <Send className="w-3.5 h-3.5 fill-current" />
                  <span>Send Proposal</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
