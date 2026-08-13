import React, { useState } from 'react';
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Heart,
  ShieldAlert,
  Ban,
  UserX,
  Compass,
  Music,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit3,
  Camera,
  Settings as SettingsIcon,
  ShieldCheck,
  Plus,
  Trash2,
  Wand2,
  MessageCircle,
  Star,
  Zap,
  Info
} from 'lucide-react';
import { UserProfile, UserSettings } from '../types';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

export interface CanonicalProfileViewProps {
  user: UserProfile;
  isOwnProfile?: boolean;
  isDrawer?: boolean; // true for modal/slide-over overlay, false for page view in Profile tab
  onClose?: () => void;

  // Actions for other users
  isMatched?: boolean;
  onLike?: (user: UserProfile) => void;
  onSuperLike?: (user: UserProfile) => void;
  onPass?: (user: UserProfile) => void;
  onOpenDateIdeas?: (user: UserProfile) => void;
  onSendMessage?: (user: UserProfile) => void;
  onUnmatch?: (user: UserProfile) => void;
  onBlock?: (user: UserProfile) => void;
  onReport?: (user: UserProfile) => void;

  // Actions for own profile
  userSettings?: UserSettings;
  onUpdateUser?: (updatedUser: Partial<UserProfile>) => void;
  onOpenSettings?: () => void;
  onOpenSubscription?: () => void;
  onStartVerification?: () => void;
}

export const CanonicalProfileView: React.FC<CanonicalProfileViewProps> = ({
  user,
  isOwnProfile = false,
  isDrawer = true,
  onClose,
  isMatched = false,
  onLike,
  onSuperLike,
  onPass,
  onOpenDateIdeas,
  onSendMessage,
  onUnmatch,
  onBlock,
  onReport,
  userSettings,
  onUpdateUser,
  onOpenSettings,
  onOpenSubscription,
  onStartVerification
}) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Edit Profile modal state (for own profile)
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingPhotos, setIsManagingPhotos] = useState(false);
  const [editedBio, setEditedBio] = useState(user.bio || '');
  const [editedJob, setEditedJob] = useState(user.jobTitle || '');
  const [editedCompany, setEditedCompany] = useState(user.company || '');
  const [editedEducation, setEditedEducation] = useState(user.education || '');
  const [editedInterests, setEditedInterests] = useState(user.interests?.join(', ') || '');
  
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [suggestedBios, setSuggestedBios] = useState<string[]>([]);

  const nextPhoto = () => {
    triggerHaptic('light');
    setActivePhotoIdx((prev) => (prev + 1) % user.photos.length);
  };

  const prevPhoto = () => {
    triggerHaptic('light');
    setActivePhotoIdx((prev) => (prev - 1 + user.photos.length) % user.photos.length);
  };

  // AI Bio Generation for Own Profile
  const handleGenerateAiBios = async () => {
    setIsGeneratingBio(true);
    triggerHaptic('light');

    try {
      const res = await fetch('/api/ai/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBio: editedBio,
          interests: user.interests,
          tone: 'witty, charismatic and memorable'
        })
      });
      const data = await res.json();
      setSuggestedBios(data.bios || []);
    } catch {
      setSuggestedBios([
        "Espresso enthusiast by day, amateur chef by night ☕🍝. Always up for live indie gigs and spontaneous road trips!",
        "Searching for someone who can beat me at board games and appreciate a perfect avocado toast 🥑.",
        "Passionate about storytelling, deep conversations, and finding the best hidden ramen spots in town 🍜✨."
      ]);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleSaveProfile = () => {
    triggerHaptic('success');
    if (onUpdateUser) {
      onUpdateUser({
        bio: editedBio,
        jobTitle: editedJob,
        company: editedCompany,
        education: editedEducation,
        interests: editedInterests.split(',').map((s) => s.trim()).filter(Boolean)
      });
    }
    setIsEditing(false);
    showNativeToast('Profile updated!');
  };

  const handleAddPhoto = () => {
    triggerHaptic('medium');
    const newPhotos = [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
    ];
    const picked = newPhotos[Math.floor(Math.random() * newPhotos.length)];
    if (onUpdateUser) {
      onUpdateUser({ photos: [...user.photos, picked] });
    }
    showNativeToast('New photo added to your profile!');
  };

  const handleDeletePhoto = (index: number) => {
    if (user.photos.length <= 1) {
      showNativeToast('At least 1 photo is required!');
      return;
    }
    triggerHaptic('warning');
    const updated = user.photos.filter((_, i) => i !== index);
    if (onUpdateUser) {
      onUpdateUser({ photos: updated });
    }
    if (activePhotoIdx >= updated.length) {
      setActivePhotoIdx(Math.max(0, updated.length - 1));
    }
  };

  const profileContent = (
    <div className={`w-full max-w-md bg-[#121316] flex flex-col text-white shadow-2xl ${
      isDrawer
        ? 'h-full overflow-y-auto border-l border-white/10 animate-in slide-in-from-right duration-300'
        : 'mx-auto rounded-3xl overflow-hidden border border-white/10 mb-20'
    }`}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#121316]/90 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-base">
            {isOwnProfile ? 'My Profile' : `${user.name}'s Profile`}
          </h3>
          {user.verified && (
            <span className="p-0.5 rounded-full bg-blue-500 text-white" title="Verified Profile">
              <Check className="w-3 h-3 stroke-[3]" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isOwnProfile && (
            <>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsEditing(true);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-rose-400 transition-colors"
                title="Edit Profile"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {onOpenSettings && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onOpenSettings();
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="App Settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {isDrawer && onClose && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Photos Carousel */}
      <div className="relative w-full h-96 bg-gray-900 flex-shrink-0">
        <img
          src={user.photos[activePhotoIdx] || user.photos[0]}
          alt={user.name}
          className="w-full h-full object-cover"
        />

        {/* Photo Pagination Dots */}
        {user.photos.length > 1 && (
          <>
            <div className="absolute top-3 left-4 right-4 flex gap-1.5 z-10">
              {user.photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i === activePhotoIdx ? 'bg-white shadow-md' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={prevPhoto}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Badge Overlay */}
        {isOwnProfile ? (
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('medium');
                if (onOpenSubscription) onOpenSubscription();
              }}
              className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/40 text-xs font-bold text-amber-300 flex items-center gap-1.5 shadow-md hover:bg-black/80 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="capitalize">{userSettings?.activeSubscriptionTier || 'Gold'} Member</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsManagingPhotos(true);
              }}
              className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-gray-200 flex items-center gap-1.5 hover:bg-black/80 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>Manage Photos ({user.photos.length})</span>
            </button>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-rose-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-rose-400" />
            <span>{user.compatibilityScore || 94}% Compatibility</span>
          </div>
        )}
      </div>

      {/* Profile Content Details */}
      <div className="p-5 space-y-6 flex-1">
        {/* Main Info */}
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black">{user.name}</h2>
            <span className="text-xl text-gray-400 font-semibold">{user.age}</span>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {user.locationName} ({user.distanceKm || 2} mi away)
            </span>
            {user.jobTitle && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                {user.jobTitle} {user.company ? `@ ${user.company}` : ''}
              </span>
            )}
            {user.education && (
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                {user.education}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-gray-200 leading-relaxed relative group">
            <p>{user.bio}</p>
            {isOwnProfile && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setIsEditing(true);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-rose-400 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>
        )}

        {/* Passions / Interests */}
        {user.interests && user.interests.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              Passions & Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-200"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prompts & Answers */}
        {user.prompts && user.prompts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Prompts
            </h4>
            {user.prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 space-y-1.5"
              >
                <p className="text-xs text-rose-400 font-semibold">{prompt.question}</p>
                <p className="text-sm text-white font-medium">{prompt.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Spotify Anthem */}
        {user.spotifyTrack && (
          <div className="p-3.5 rounded-2xl bg-[#1db954]/10 border border-[#1db954]/30 flex items-center gap-3">
            <img
              src={user.spotifyTrack.albumCover}
              alt=""
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-[#1db954] flex items-center gap-1">
                <Music className="w-3 h-3" /> Favorite Anthem
              </p>
              <p className="text-xs font-bold text-white truncate">{user.spotifyTrack.title}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.spotifyTrack.artist}</p>
            </div>
          </div>
        )}

        {/* Lifestyle & Details Grid */}
        {user.lifestyle && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              Lifestyle & Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {user.lifestyle.drinking && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  🍸 {user.lifestyle.drinking}
                </div>
              )}
              {user.lifestyle.workout && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  💪 {user.lifestyle.workout}
                </div>
              )}
              {user.lifestyle.pets && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  🐾 {user.lifestyle.pets}
                </div>
              )}
              {user.lifestyle.languages && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  🗣️ {user.lifestyle.languages.join(', ')}
                </div>
              )}
              {user.lifestyle.wantChildren && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  👶 {user.lifestyle.wantChildren}
                </div>
              )}
              {user.lifestyle.childrenCount && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  🍼 Given Birth To: {user.lifestyle.childrenCount}
                </div>
              )}
              {user.lookingFor && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  🎯 {user.lookingFor}
                </div>
              )}
              {user.lifestyle.lookingForGender && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  👀 Seeking: {user.lifestyle.lookingForGender}
                </div>
              )}
              {user.lifestyle.communicationStyle && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  💬 Style: {user.lifestyle.communicationStyle}
                </div>
              )}
              {user.lifestyle.smoking && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  🚭 Smoking: {user.lifestyle.smoking}
                </div>
              )}
              {user.zodiac && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  ✨ Zodiac: {user.zodiac}
                </div>
              )}
              {user.height && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-300">
                  📏 Height: {user.height}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTEXTUAL ACTION BUTTONS */}
        {isOwnProfile ? (
          /* OWN PROFILE ACTIONS */
          <div className="pt-2 border-t border-white/10 space-y-2.5">
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsEditing(true);
              }}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-102 transition-transform"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile Details & AI Bio</span>
            </button>

            {!user.verified && onStartVerification && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onStartVerification();
                }}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-102 transition-transform"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Profile with Selfie (Blue Badge)</span>
              </button>
            )}

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsManagingPhotos(true);
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-white/5"
            >
              <Camera className="w-4 h-4 text-rose-400" />
              <span>Manage Gallery Photos</span>
            </button>

            {onOpenSubscription && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenSubscription();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/20 hover:from-amber-400/30 hover:to-amber-500/30 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Manage CREST Gold Subscription</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenSettings();
                }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <SettingsIcon className="w-4 h-4 text-gray-400" />
                <span>Account & App Settings</span>
              </button>
            )}
          </div>
        ) : (
          /* OTHER USER'S PROFILE ACTIONS */
          <div className="pt-2 border-t border-white/10 space-y-2.5">
            {/* Primary interaction depending on matched state */}
            {isMatched ? (
              <>
                {onOpenDateIdeas && (
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      if (onClose) onClose();
                      onOpenDateIdeas(user);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-102 transition-transform"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Generate First Date Ideas with {user.name}</span>
                  </button>
                )}

                {onSendMessage && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      if (onClose) onClose();
                      onSendMessage(user);
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                )}
              </>
            ) : (
              /* Discover / Likes / Search action buttons */
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {onLike && (
                    <button
                      onClick={() => {
                        triggerHaptic('success');
                        if (onClose) onClose();
                        onLike(user);
                      }}
                      className="py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 hover:scale-102 transition-transform"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Like {user.name}</span>
                    </button>
                  )}

                  {onSuperLike && (
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        if (onClose) onClose();
                        onSuperLike(user);
                      }}
                      className="py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 hover:scale-102 transition-transform"
                    >
                      <Star className="w-4 h-4 fill-white" />
                      <span>Super Like</span>
                    </button>
                  )}
                </div>

                {onPass && (
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      if (onClose) onClose();
                      onPass(user);
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Pass</span>
                  </button>
                )}
              </div>
            )}

            {/* Safety Actions */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              {isMatched && onUnmatch && (
                <button
                  onClick={() => {
                    triggerHaptic('warning');
                    onUnmatch(user);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span>Unmatch with {user.name}</span>
                </button>
              )}

              {onBlock && (
                <button
                  onClick={() => {
                    triggerHaptic('warning');
                    onBlock(user);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Ban className="w-4 h-4 text-red-400" />
                  <span>Block User</span>
                </button>
              )}

              {onReport && (
                <button
                  onClick={() => {
                    triggerHaptic('warning');
                    onReport(user);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-300 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Report Profile or Messages</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3">
          <div className="bg-[#171819] w-full max-w-md rounded-3xl p-5 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto border border-white/10 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base text-white">
                Edit Profile Details
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bio Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-300">
                  Bio / About Me
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiBios}
                  className="text-[11px] font-bold text-rose-400 flex items-center gap-1 hover:underline"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI Polish</span>
                </button>
              </div>

              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                rows={3}
                className="w-full p-3 bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-medium focus:outline-none focus:border-rose-500 placeholder-gray-500"
                placeholder="Tell potential matches about your passions, hobbies, and adventures..."
              />

              {/* AI Bio Suggestions list */}
              {isGeneratingBio ? (
                <p className="text-xs text-rose-400 animate-pulse mt-1">Generating clever bio options...</p>
              ) : (
                suggestedBios.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase text-rose-400">Tap to select AI Bio Option:</p>
                    {suggestedBios.map((bioOption, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          triggerHaptic('light');
                          setEditedBio(bioOption);
                        }}
                        className="p-2.5 rounded-xl bg-rose-500/10 text-xs font-medium text-rose-200 cursor-pointer hover:bg-rose-500/20 transition-colors border border-rose-500/30"
                      >
                        "{bioOption}"
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Job & Company */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Job Title</label>
                <input
                  type="text"
                  value={editedJob}
                  onChange={(e) => setEditedJob(e.target.value)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500"
                  placeholder="e.g. Product Designer"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Company</label>
                <input
                  type="text"
                  value={editedCompany}
                  onChange={(e) => setEditedCompany(e.target.value)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500"
                  placeholder="e.g. Studio"
                />
              </div>
            </div>

            {/* Education */}
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Education</label>
              <input
                type="text"
                value={editedEducation}
                onChange={(e) => setEditedEducation(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500"
                placeholder="e.g. NYU / Computer Science"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Interests (Comma separated)
              </label>
              <input
                type="text"
                value={editedInterests}
                onChange={(e) => setEditedInterests(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500"
                placeholder="e.g. Coffee, Hiking, Indie Music, Photography"
              />
            </div>

            {/* Save Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md hover:scale-102 transition-transform"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE PHOTOS MODAL */}
      {isManagingPhotos && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3">
          <div className="bg-[#171819] w-full max-w-md rounded-3xl p-5 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto border border-white/10 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Manage Photo Gallery</h3>
                <p className="text-xs text-gray-400">Add up to 6 high quality pictures</p>
              </div>
              <button
                onClick={() => setIsManagingPhotos(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {user.photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative rounded-2xl overflow-hidden aspect-square bg-gray-900 group border border-white/10"
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeletePhoto(index)}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors shadow-md"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-rose-500 text-[9px] font-bold text-white uppercase">
                      Primary
                    </span>
                  )}
                </div>
              ))}

              {user.photos.length < 6 && (
                <button
                  onClick={handleAddPhoto}
                  className="rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center p-2 text-gray-400 hover:text-rose-400 hover:border-rose-400/50 transition-colors aspect-square"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Add Photo</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setIsManagingPhotos(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (!isDrawer) {
    return profileContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
      {profileContent}
    </div>
  );
};
