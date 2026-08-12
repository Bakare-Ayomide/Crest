import React, { useState } from 'react';
import { Search, Send, Image, Mic, Sparkles, Phone, Video, ChevronLeft, CheckCheck, MapPin, Smile, X, Play, Pause, Compass, ShieldAlert } from 'lucide-react';
import { Match, Message, UserProfile } from '../types';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

interface MatchesChatViewProps {
  matches: Match[];
  activeMatch: Match | null;
  setActiveMatch: (match: Match | null) => void;
  onSendMessage: (matchId: string, text: string, media?: { isImage?: boolean; imageUrl?: string; isAudio?: boolean; audioUrl?: string; isGif?: boolean; gifUrl?: string }) => void;
  onReportProfile: (profile: UserProfile) => void;
}

export const MatchesChatView: React.FC<MatchesChatViewProps> = ({
  matches,
  activeMatch,
  setActiveMatch,
  onSendMessage,
  onReportProfile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inputText, setInputText] = useState('');
  const [showAiWingman, setShowAiWingman] = useState(false);
  const [aiStarters, setAiStarters] = useState<string[]>([]);
  const [loadingStarters, setLoadingStarters] = useState(false);
  
  const [showDateSpotModal, setShowDateSpotModal] = useState(false);
  const [dateSpots, setDateSpots] = useState<any[]>([]);
  const [loadingDateSpots, setLoadingDateSpots] = useState(false);

  const [activeCallModal, setActiveCallModal] = useState<'audio' | 'video' | null>(null);
  const [isPlayingAudioId, setIsPlayingAudioId] = useState<string | null>(null);

  // Fetch AI Icebreaker starters
  const handleFetchIcebreakers = async () => {
    if (!activeMatch) return;
    setLoadingStarters(true);
    setShowAiWingman(true);
    triggerHaptic('light');

    try {
      const res = await fetch('/api/ai/icebreaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchName: activeMatch.user.name,
          matchInterests: activeMatch.user.interests,
          bio: activeMatch.user.bio
        })
      });
      const data = await res.json();
      setAiStarters(data.starters || []);
    } catch (e) {
      setAiStarters([
        `Hey ${activeMatch.user.name}! What's the best weekend spot in SF?`,
        `Your photo in ${activeMatch.user.locationName} looks incredible! When was that taken?`
      ]);
    } finally {
      setLoadingStarters(false);
    }
  };

  // Fetch AI Date Spot Suggestions
  const handleFetchDateSpots = async () => {
    if (!activeMatch) return;
    setLoadingDateSpots(true);
    setShowDateSpotModal(true);
    triggerHaptic('light');

    try {
      const res = await fetch('/api/ai/datespot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: activeMatch.user.locationName,
          vibe: 'cozy and stylish'
        })
      });
      const data = await res.json();
      setDateSpots(data.suggestions || []);
    } catch (e) {
      setDateSpots([
        { name: "Artisanal Coffee & Coastal Walk", vibe: "Casual & Fresh", activity: "Stroll & Conversation" },
        { name: "Speakeasy Cocktail Bar", vibe: "Ambient & Romantic", activity: "Craft Drinks" }
      ]);
    } finally {
      setLoadingDateSpots(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeMatch) return;
    triggerHaptic('light');
    onSendMessage(activeMatch.id, inputText.trim());
    setInputText('');
  };

  const handleSendImage = () => {
    if (!activeMatch) return;
    triggerHaptic('medium');
    const sampleImages = [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
    ];
    const img = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    onSendMessage(activeMatch.id, '📷 Sent a photo', { isImage: true, imageUrl: img });
    showNativeToast('Photo sent');
  };

  const handleSendVoiceNote = () => {
    if (!activeMatch) return;
    triggerHaptic('medium');
    onSendMessage(activeMatch.id, '🎤 Voice Note (0:14)', {
      isAudio: true,
      audioUrl: 'mock_audio',
      audioDuration: '0:14'
    });
    showNativeToast('Voice note recorded & sent!');
  };

  const filteredMatches = matches.filter(m =>
    m.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // IF AN ACTIVE CHAT IS SELECTED
  if (activeMatch) {
    return (
      <div className="flex-1 flex flex-col h-[calc(100vh-120px)] max-w-md mx-auto w-full bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-2.5 flex items-center justify-between z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { triggerHaptic('light'); setActiveMatch(null); }}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative">
              <img
                src={activeMatch.user.photos[0]}
                alt={activeMatch.user.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
              {activeMatch.onlineStatus === 'online' && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
              )}
            </div>

            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1">
                <span>{activeMatch.user.name}</span>
                <span className="text-xs font-normal text-gray-400">, {activeMatch.user.age}</span>
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {activeMatch.onlineStatus === 'online' ? 'Active Now' : 'Recently Active'}
              </p>
            </div>
          </div>

          {/* Call & AI Date Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleFetchDateSpots}
              className="p-2 rounded-xl text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="AI Date Spot Suggestions"
            >
              <Compass className="w-5 h-5" />
            </button>

            <button
              onClick={() => { triggerHaptic('medium'); setActiveCallModal('audio'); }}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Start Voice Call"
            >
              <Phone className="w-5 h-5" />
            </button>

            <button
              onClick={() => { triggerHaptic('heavy'); setActiveCallModal('video'); }}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Start Video Call"
            >
              <Video className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* Match Intro Tag */}
          <div className="text-center my-4">
            <img
              src={activeMatch.user.photos[0]}
              alt=""
              className="w-16 h-16 rounded-full mx-auto object-cover mb-2 ring-4 ring-rose-100 dark:ring-rose-950/50 shadow-md"
            />
            <p className="font-bold text-sm text-gray-900 dark:text-white">
              You matched with {activeMatch.user.name}!
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Matched {activeMatch.matchedAt} • {activeMatch.user.compatibilityScore}% Compatibility
            </p>
          </div>

          {/* Messages */}
          {activeMatch.lastMessage && (
            <div
              className={`flex flex-col ${
                activeMatch.lastMessage.senderId === 'user_me' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm shadow-xs ${
                  activeMatch.lastMessage.senderId === 'user_me'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-700'
                }`}
              >
                {activeMatch.lastMessage.isImage && activeMatch.lastMessage.imageUrl && (
                  <img src={activeMatch.lastMessage.imageUrl} alt="" className="rounded-xl mb-1.5 max-h-48 w-full object-cover" />
                )}

                {activeMatch.lastMessage.isAudio ? (
                  <div className="flex items-center gap-3 py-1">
                    <button
                      onClick={() => setIsPlayingAudioId(prev => prev ? null : 'm1')}
                      className="p-2 rounded-full bg-white/20 text-white"
                    >
                      {isPlayingAudioId === 'm1' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="w-24 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div className={`h-full bg-white rounded-full ${isPlayingAudioId === 'm1' ? 'w-2/3 animate-pulse' : 'w-0'}`} />
                      </div>
                      <span className="text-[10px] opacity-80 mt-1 block">{activeMatch.lastMessage.audioDuration}</span>
                    </div>
                  </div>
                ) : (
                  <p className="leading-relaxed">{activeMatch.lastMessage.text}</p>
                )}
              </div>

              <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 px-1">
                <span>{activeMatch.lastMessage.timestamp}</span>
                {activeMatch.lastMessage.senderId === 'user_me' && (
                  <CheckCheck className="w-3 h-3 text-rose-500" />
                )}
              </div>
            </div>
          )}

          {/* AI Icebreaker Suggestions Tray if open */}
          {showAiWingman && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600 fill-purple-600" />
                  <span>AI Wingman Opener Suggestions</span>
                </div>
                <button onClick={() => setShowAiWingman(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingStarters ? (
                <div className="text-center py-3 text-xs text-purple-600 animate-pulse">
                  Analyzing {activeMatch.user.name}'s bio and generating clever openers...
                </div>
              ) : (
                <div className="space-y-1.5">
                  {aiStarters.map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        triggerHaptic('light');
                        setInputText(starter);
                        setShowAiWingman(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-medium text-gray-800 dark:text-gray-200 transition-colors border border-purple-100 dark:border-purple-900"
                    >
                      "{starter}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          
          {/* Quick AI Starter trigger pill */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleFetchIcebreakers}
              className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1 hover:bg-purple-200 transition-colors"
            >
              <Sparkles className="w-3 h-3 fill-current" />
              <span>AI Wingman Opener</span>
            </button>

            <button
              onClick={handleFetchDateSpots}
              className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-200 transition-colors"
            >
              <Compass className="w-3 h-3" />
              <span>Date Ideas</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendImage}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Attach Photo"
            >
              <Image className="w-5 h-5" />
            </button>

            <button
              onClick={handleSendVoiceNote}
              className="p-2 text-gray-400 hover:text-rose-500"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${activeMatch.user.name}...`}
              className="flex-1 py-2 px-3.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-full text-white transition-all ${
                inputText.trim()
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 scale-105 shadow-md'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* AI Date Spot Recommendations Modal */}
        {showDateSpotModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-5 shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-base text-gray-900 dark:text-white">
                  <Compass className="w-5 h-5 text-amber-500" />
                  <span>AI First Date Spots in {activeMatch.user.locationName}</span>
                </div>
                <button onClick={() => setShowDateSpotModal(false)} className="p-1 rounded-full text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingDateSpots ? (
                <p className="text-center py-6 text-xs text-amber-600 animate-pulse">
                  Scouting the best romantic spots nearby...
                </p>
              ) : (
                <div className="space-y-3">
                  {dateSpots.map((spot, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">{spot.name}</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">{spot.vibe} • {spot.activity}</p>
                      <button
                        onClick={() => {
                          triggerHaptic('light');
                          setInputText(`Hey! How about we check out ${spot.name} for our first date? 🍸`);
                          setShowDateSpotModal(false);
                        }}
                        className="mt-2 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Send as Invite Proposal →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Video / Voice Call Modal */}
        {activeCallModal && (
          <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col items-center justify-between p-6 text-white">
            <div className="text-center mt-8">
              <img
                src={activeMatch.user.photos[0]}
                alt=""
                className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-rose-500 shadow-2xl animate-pulse"
              />
              <h3 className="text-2xl font-black mt-4">{activeMatch.user.name}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {activeCallModal === 'video' ? 'Calling with Video...' : 'Audio Calling...'}
              </p>
            </div>

            <div className="w-full max-w-xs bg-gray-900/80 rounded-2xl p-4 text-center border border-white/10">
              <p className="text-xs text-gray-300">
                🔒 CREST End-to-End Encrypted Native Call
              </p>
            </div>

            <div className="flex items-center gap-6 mb-12">
              <button
                onClick={() => { triggerHaptic('heavy'); setActiveCallModal(null); }}
                className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl hover:scale-105"
              >
                <Phone className="w-8 h-8 transform rotate-[135deg]" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MATCHES LIST DEFAULT VIEW
  return (
    <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 pb-24 space-y-5">
      
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search matches by name or passion..."
          className="w-full py-2 pl-9 pr-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* New Matches Row */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
          New Matches ({matches.length})
        </h4>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => { triggerHaptic('light'); setActiveMatch(match); }}
              className="flex flex-col items-center gap-1 cursor-pointer group flex-shrink-0"
            >
              <div className="relative">
                <img
                  src={match.user.photos[0]}
                  alt={match.user.name}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-rose-500 p-0.5 group-hover:scale-105 transition-transform"
                />
                {match.onlineStatus === 'online' && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
                )}
              </div>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 w-16 text-center truncate">
                {match.user.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 px-1">
          Conversations
        </h4>
        <div className="space-y-1">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              onClick={() => { triggerHaptic('light'); setActiveMatch(match); }}
              className="p-3 rounded-2xl bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 flex items-center gap-3 cursor-pointer transition-colors"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={match.user.photos[0]}
                  alt={match.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {match.onlineStatus === 'online' && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {match.user.name}
                  </h5>
                  <span className="text-[10px] text-gray-400">{match.lastMessage?.timestamp || match.matchedAt}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {match.lastMessage?.text || `Matched! Say hello to ${match.user.name}`}
                </p>
              </div>

              {match.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                  {match.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
