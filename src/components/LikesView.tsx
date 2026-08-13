import React, { useState } from 'react';
import { Heart, Sparkles, Lock, Star, MessageCircle, Flame, Clock } from 'lucide-react';
import { UserProfile } from '../types';
import { triggerHaptic } from '../lib/capacitor';
import { CanonicalProfileView } from './CanonicalProfileView';

interface LikesViewProps {
  likedYouProfiles: UserProfile[];
  topPicksProfiles: UserProfile[];
  isGold: boolean;
  onOpenSubscription: () => void;
  onMatchUser: (profile: UserProfile) => void;
  onSuperLikeUser: (profile: UserProfile) => void;
  onReportProfile?: (profile: UserProfile) => void;
}

export const LikesView: React.FC<LikesViewProps> = ({
  likedYouProfiles,
  topPicksProfiles,
  isGold,
  onOpenSubscription,
  onMatchUser,
  onSuperLikeUser,
  onReportProfile
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'likedYou' | 'topPicks'>('likedYou');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  return (
    <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 pb-24">
      {/* Tab Switcher Header */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-4">
        <button
          onClick={() => { triggerHaptic('light'); setActiveSubTab('likedYou'); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'likedYou'
              ? 'bg-white dark:bg-gray-900 text-rose-500 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
          <span>{likedYouProfiles.length} Liked You</span>
        </button>

        <button
          onClick={() => { triggerHaptic('light'); setActiveSubTab('topPicks'); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'topPicks'
              ? 'bg-white dark:bg-gray-900 text-amber-500 shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Top Picks</span>
          <span className="bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 text-[10px] px-1.5 py-0.2 rounded-full">
            AI
          </span>
        </button>
      </div>

      {/* LIKED YOU TAB CONTENT */}
      {activeSubTab === 'likedYou' && (
        <div className="space-y-4">
          
          {/* Gold Banner if un-subscribed */}
          {!isGold && (
            <div 
              onClick={() => { triggerHaptic('medium'); onOpenSubscription(); }}
              className="p-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-gray-950 shadow-lg cursor-pointer hover:opacity-95 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-gray-950" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">See Who Liked You</h4>
                  <p className="text-xs font-medium text-gray-900/80">Upgrade to CREST Gold to unblur and match instantly</p>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-gray-950 text-amber-300 rounded-full text-xs font-bold whitespace-nowrap shadow-md">
                Unlock
              </button>
            </div>
          )}

          {/* Grid of Liked You */}
          <div className="grid grid-cols-2 gap-3">
            {likedYouProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => {
                  if (isGold) {
                    triggerHaptic('light');
                    setSelectedProfile(profile);
                  } else {
                    triggerHaptic('medium');
                    onOpenSubscription();
                  }
                }}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-gray-200 dark:bg-gray-800 shadow-sm group border border-gray-100 dark:border-gray-800 cursor-pointer"
              >
                <img
                  src={profile.photos[0]}
                  alt={profile.name}
                  className={`w-full h-full object-cover transition-all ${
                    !isGold ? 'filter blur-md scale-105 opacity-90' : 'group-hover:scale-105'
                  }`}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
                  
                  {/* Top Superlike Badge */}
                  {profile.superLikedYou && (
                    <div className="self-start px-2 py-0.5 rounded-md bg-sky-500/90 backdrop-blur-xs text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-white" />
                      <span>SUPER LIKED YOU</span>
                    </div>
                  )}

                  {/* Lock Screen for Non-Gold */}
                  {!isGold ? (
                    <div className="my-auto flex flex-col items-center justify-center text-center p-2">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-gray-950 flex items-center justify-center mb-1 shadow-md">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold">Blurred Profile</span>
                    </div>
                  ) : (
                    <div className="mt-auto">
                      <h4 className="font-bold text-base leading-tight">
                        {profile.name}, {profile.age}
                      </h4>
                      <p className="text-[11px] text-gray-300">{profile.distanceKm} km away</p>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('success');
                          onMatchUser(profile);
                        }}
                        className="mt-2 w-full py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1 hover:scale-102 transition-transform"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        <span>Match Back</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP PICKS TAB CONTENT */}
      {activeSubTab === 'topPicks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <span className="font-semibold">Curated for you by AI today</span>
            <span className="flex items-center gap-1 text-amber-500 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Refreshes in 14h</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {topPicksProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedProfile(profile);
                }}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-gray-900 shadow-md group border border-gray-100 dark:border-gray-800 cursor-pointer"
              >
                <img
                  src={profile.photos[0]}
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-400 text-gray-950 font-bold text-[10px] flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3 fill-gray-950" />
                  <span>{profile.compatibilityScore}% Match</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="font-bold text-base leading-tight">
                    {profile.name}, {profile.age}
                  </h4>
                  <p className="text-[11px] text-gray-300 line-clamp-1">{profile.interests.slice(0, 2).join(' • ')}</p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('heavy');
                      onSuperLikeUser(profile);
                    }}
                    className="mt-2 w-full py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md flex items-center justify-center gap-1 hover:scale-102 transition-transform"
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>Super Like</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CANONICAL PROFILE VIEW DRAWER */}
      {selectedProfile && (
        <CanonicalProfileView
          user={selectedProfile}
          isDrawer={true}
          isOwnProfile={false}
          isMatched={false}
          onClose={() => setSelectedProfile(null)}
          onLike={(u) => {
            onMatchUser(u);
            setSelectedProfile(null);
          }}
          onSuperLike={(u) => {
            onSuperLikeUser(u);
            setSelectedProfile(null);
          }}
          onReport={(u) => {
            if (onReportProfile) onReportProfile(u);
            setSelectedProfile(null);
          }}
        />
      )}
    </div>
  );
};
