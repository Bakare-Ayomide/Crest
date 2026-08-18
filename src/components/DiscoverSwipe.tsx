import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Heart, X, MapPin, MoreHorizontal, Info, Sparkles, RotateCcw, Zap } from 'lucide-react';
import { UserProfile, SwipeDirection } from '../types';
import { triggerHaptic } from '../lib/capacitor';
import { CanonicalProfileView } from './CanonicalProfileView';

interface DiscoverSwipeProps {
  profiles: UserProfile[];
  onSwipe: (profile: UserProfile, direction: SwipeDirection) => void;
  onRewind: () => void;
  canRewind: boolean;
  onBoost: () => void;
  isBoostActive: boolean;
  onReportProfile: (profile: UserProfile) => void;
  onOpenFilters?: () => void;
  onOpenNotifications?: () => void;
}

export const DiscoverSwipe: React.FC<DiscoverSwipeProps> = ({
  profiles,
  onSwipe,
  onRewind,
  canRewind,
  onBoost,
  isBoostActive,
  onReportProfile,
  onOpenFilters,
  onOpenNotifications
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSubTab, setSelectedSubTab] = useState<'foryou' | 'nearby'>('foryou');
  const [selectedProfileModal, setSelectedProfileModal] = useState<UserProfile | null>(null);

  // Motion values for touch swipe gestures
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-30, -120], [0, 1]);

  const activeProfile = profiles[currentIndex] || profiles[0];
  const nextProfile1 = profiles[currentIndex + 1];
  const nextProfile2 = profiles[currentIndex + 2];

  const handleDragEnd = (_: any, info: any) => {
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;

    if (offsetX > 100 || velocityX > 500) {
      triggerSwipe('right');
    } else if (offsetX < -100 || velocityX < -500) {
      triggerSwipe('left');
    }
  };

  const triggerSwipe = (direction: SwipeDirection) => {
    if (!activeProfile) return;
    triggerHaptic(direction === 'right' ? 'success' : 'light');
    onSwipe(activeProfile, direction);
    setCurrentIndex(prev => prev + 1);
  };

  if (!activeProfile || currentIndex >= profiles.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 text-white bg-[#101112] min-h-[80vh]">
        <div className="w-20 h-20 rounded-full bg-[#E98BD0]/20 text-[#E98BD0] flex items-center justify-center shadow-inner">
          <Sparkles className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white">You've reached the end!</h3>
        <p className="text-xs text-[#B8B8BA] max-w-xs leading-relaxed">
          No more profiles nearby right now. Expand your location filters or rewind to review recent cards.
        </p>
        <button
          onClick={() => { triggerHaptic('medium'); setCurrentIndex(0); }}
          className="px-6 py-3 rounded-full bg-[#FF4058] text-white font-bold text-xs shadow-lg hover:scale-105 transition-transform"
        >
          Discover Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full px-4 pt-1 pb-24 relative select-none bg-[#101112] text-white font-sans">
      
      {/* TOP HEADER */}
      <div className="flex items-center justify-between pt-1 pb-2">
        {/* Header Title / Brand */}
        <h1 className="font-crest-script text-3xl font-bold crest-gradient-text tracking-normal drop-shadow-sm">
          Crest
        </h1>

        {/* Options Menu Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            if (onOpenFilters) onOpenFilters();
          }}
          className="w-12 h-12 rounded-[18px] bg-[#171819] flex items-center justify-center text-white shadow-md hover:bg-[#242526] transition-colors"
          title="Discovery Filters"
        >
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* DISCOVERY FILTERS — SPEC COMPLIANT */}
      <div className="flex items-center justify-center gap-2.5 my-2">
        {/* NEARBY Pill */}
        <button
          onClick={() => { triggerHaptic('light'); setSelectedSubTab('nearby'); }}
          className={`px-5 py-2.5 rounded-[30px] text-xs font-bold flex items-center gap-2 transition-all ${
            selectedSubTab === 'nearby'
              ? 'bg-[#E98BD0] text-[#101112] shadow-md'
              : 'bg-[#171819] text-white hover:bg-[#242526]'
          }`}
        >
          <MapPin className={`w-3.5 h-3.5 ${selectedSubTab === 'nearby' ? 'text-[#101112]' : 'text-white'}`} />
          <span className="uppercase tracking-wider text-[11px]">NEARBY</span>
        </button>

        {/* FOR YOU Pill (Selected State) */}
        <button
          onClick={() => { triggerHaptic('light'); setSelectedSubTab('foryou'); }}
          className={`px-5 py-2.5 rounded-[30px] text-xs font-bold flex items-center gap-2 transition-all ${
            selectedSubTab === 'foryou'
              ? 'bg-[#E98BD0] text-[#101112] shadow-md'
              : 'bg-[#171819] text-white hover:bg-[#242526]'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 fill-current ${selectedSubTab === 'foryou' ? 'text-[#101112]' : 'text-white'}`} />
          <span className="uppercase tracking-wider text-[11px]">FOR YOU</span>
        </button>
      </div>

      {/* PROFILE CARD DECK STACK */}
      <div className="relative flex-1 w-full flex items-center justify-center my-2 min-h-[460px] max-h-[520px]">
        
        {/* Stack Card 3 (Deepest) */}
        {nextProfile2 && (
          <div className="absolute inset-x-5 top-0 bottom-10 rounded-[26px] overflow-hidden bg-[#171819] shadow-md transform scale-[0.88] -translate-y-8 opacity-60 pointer-events-none rotate-[6deg] border border-white/5">
            <img src={nextProfile2.photos[0]} alt="" className="w-full h-full object-cover filter brightness-75" />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-gray-200">
              <span className="w-2 h-2 rounded-full bg-[#FF4058]" />
              <span className="uppercase tracking-wider">OFFLINE</span>
            </div>
          </div>
        )}

        {/* Stack Card 2 (Middle) */}
        {nextProfile1 && (
          <div className="absolute inset-x-3 top-1 bottom-6 rounded-[26px] overflow-hidden bg-[#171819] shadow-lg transform scale-[0.94] -translate-y-4 opacity-80 pointer-events-none -rotate-[4deg] border border-white/5">
            <img src={nextProfile1.photos[0]} alt="" className="w-full h-full object-cover filter brightness-85" />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-gray-200">
              <span className="w-2 h-2 rounded-full bg-[#FF4058]" />
              <span className="uppercase tracking-wider">OFFLINE</span>
            </div>
          </div>
        )}

        {/* Active Front Card */}
        <AnimatePresence>
          <motion.div
            key={activeProfile.id}
            style={{ x, y, rotate }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            className="absolute inset-0 rounded-[26px] overflow-hidden bg-[#171819] shadow-2xl cursor-grab active:cursor-grabbing border border-white/10 z-20 flex flex-col justify-between"
          >
            {/* Main Profile Photo */}
            <img
              src={activeProfile.photos[0]}
              alt={activeProfile.name}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Glowing Green Online Indicator Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#55F45A] shadow-[0_0_8px_#55F45A]" />
              <span className="text-xs font-semibold tracking-wider text-white uppercase">ONLINE</span>
            </div>

            {/* Drag Gesture Stamps */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-10 left-6 z-30 border-4 border-[#55F45A] text-[#55F45A] font-black text-2xl uppercase tracking-wider px-3 py-1 rounded-xl transform -rotate-12 pointer-events-none"
            >
              LIKE
            </motion.div>

            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-10 right-6 z-30 border-4 border-[#FF4058] text-[#FF4058] font-black text-2xl uppercase tracking-wider px-3 py-1 rounded-xl transform rotate-12 pointer-events-none"
            >
              NOPE
            </motion.div>

            {/* Dark Gradient Bottom Overlay */}
            <div className="absolute inset-x-0 bottom-0 pt-16 pb-8 px-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 flex flex-col justify-end space-y-1 pointer-events-none">
              
              {/* Profile Name & Age */}
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl font-normal text-white tracking-wide uppercase font-sans">
                  {activeProfile.name}
                </h2>
                <span className="text-2xl font-normal text-[#706A68] font-sans">
                  {activeProfile.age}
                </span>
              </div>

              {/* Location & Miles Away */}
              <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#E98BD0]" />
                <span className="uppercase tracking-wider">
                  {Math.round((activeProfile.distanceKm || 2) * 0.621371)} MILES AWAY • {activeProfile.locationName || 'USA, NEW YORK'}
                </span>
              </div>
            </div>

            {/* Info Trigger Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                setSelectedProfileModal(activeProfile);
              }}
              className="absolute right-4 bottom-6 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
              title="Profile Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* SWIPE ACTIONS OVERLAPPING PILL BAR — SPEC COMPLIANT */}
      <div className="flex items-center justify-center -mt-8 z-30 relative">
        <div className="p-2 rounded-[46px] bg-[#171819] shadow-2xl border border-white/10 flex items-center gap-3">
          
          {/* Reject Button (X) */}
          <button
            onClick={() => triggerSwipe('left')}
            className="w-14 h-14 rounded-full bg-[#242526] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-md"
            title="Pass"
          >
            <X className="w-6 h-6 stroke-[2]" />
          </button>

          {/* Like Button (Coral Red Heart) */}
          <button
            onClick={() => triggerSwipe('right')}
            className="w-16 h-16 rounded-full bg-[#FF4058] text-white flex items-center justify-center shadow-lg shadow-[#FF4058]/40 hover:scale-105 transition-transform"
            title="Like"
          >
            <Heart className="w-7 h-7 fill-white text-[#FF4058]" />
          </button>
        </div>
      </div>

      {/* CANONICAL PROFILE VIEW MODAL */}
      {selectedProfileModal && (
        <CanonicalProfileView
          user={selectedProfileModal}
          isDrawer={true}
          isOwnProfile={false}
          isMatched={false}
          onClose={() => setSelectedProfileModal(null)}
          onLike={(u) => {
            triggerSwipe('right');
            setSelectedProfileModal(null);
          }}
          onSuperLike={(u) => {
            triggerHaptic('medium');
            onSwipe(u, 'up');
            setCurrentIndex((prev) => prev + 1);
            setSelectedProfileModal(null);
          }}
          onPass={(u) => {
            triggerSwipe('left');
            setSelectedProfileModal(null);
          }}
          onReport={(u) => {
            onReportProfile(u);
            setSelectedProfileModal(null);
          }}
        />
      )}
    </div>
  );
};
