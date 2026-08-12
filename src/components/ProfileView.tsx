import React, { useState } from 'react';
import { UserProfile, UserSettings } from '../types';
import { BadgeCheck, Edit3, Camera, Sparkles, Settings as SettingsIcon, ShieldCheck, Plus, Trash2, Wand2, Music, Briefcase, MapPin, Heart, ChevronRight, Zap } from 'lucide-react';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  userSettings: UserSettings;
  onOpenSettings: () => void;
  onOpenSubscription: () => void;
  onStartVerification: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  userSettings,
  onOpenSettings,
  onOpenSubscription,
  onStartVerification
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState(user.bio);
  const [editedJob, setEditedJob] = useState(user.jobTitle || '');
  const [editedCompany, setEditedCompany] = useState(user.company || '');
  const [editedInterests, setEditedInterests] = useState(user.interests.join(', '));
  
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [suggestedBios, setSuggestedBios] = useState<string[]>([]);

  // Generate AI Bios
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
    } catch (e) {
      setSuggestedBios([
        "Espresso enthusiast by day, amateur chef by night ☕🍝. Always up for live indie gigs and spontaneous road trips!",
        "Searching for someone who can beat me at board games and appreciate a perfect avocado toast 🥑."
      ]);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleSaveProfile = () => {
    triggerHaptic('success');
    onUpdateUser({
      bio: editedBio,
      jobTitle: editedJob,
      company: editedCompany,
      interests: editedInterests.split(',').map(s => s.trim()).filter(Boolean)
    });
    setIsEditing(false);
    showNativeToast('Profile updated!');
  };

  const handleAddPhoto = () => {
    triggerHaptic('medium');
    const newPhotos = [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ];
    const picked = newPhotos[Math.floor(Math.random() * newPhotos.length)];
    onUpdateUser({ photos: [...user.photos, picked] });
    showNativeToast('New photo added to your profile!');
  };

  const handleDeletePhoto = (index: number) => {
    if (user.photos.length <= 1) {
      showNativeToast('At least 1 photo is required!');
      return;
    }
    triggerHaptic('warning');
    const updated = user.photos.filter((_, i) => i !== index);
    onUpdateUser({ photos: updated });
  };

  return (
    <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 pb-24 space-y-5">
      
      {/* Profile Header Avatar Banner */}
      <div className="relative flex flex-col items-center text-center p-5 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800">
        
        {/* Settings Gear & Upgrade */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={() => { triggerHaptic('light'); onOpenSettings(); }}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            title="App Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Main Photo Avatar */}
        <div className="relative mb-3 group">
          <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-lg">
            <img
              src={user.photos[0]}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-rose-500 text-white shadow-md hover:scale-105 transition-transform"
            title="Edit Profile"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Name & Verification Badge */}
        <div className="flex items-center gap-1.5 justify-center">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            {user.name}, {user.age}
          </h2>
          {user.verified ? (
            <BadgeCheck className="w-5 h-5 text-sky-500 fill-sky-500/20" title="Verified Member" />
          ) : (
            <button
              onClick={() => { triggerHaptic('medium'); onStartVerification(); }}
              className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-200"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Verify Now</span>
            </button>
          )}
        </div>

        {/* Job & Location */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {user.jobTitle} • {user.locationName}
        </p>

        {/* Subscription Badge */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => { triggerHaptic('medium'); onOpenSubscription(); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs ${
              userSettings.activeSubscriptionTier !== 'free'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span className="capitalize">{userSettings.activeSubscriptionTier} Subscription</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>
      </div>

      {/* Photo Gallery Grid Manager */}
      <div className="p-4 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">
            Photo Gallery ({user.photos.length}/6)
          </h3>
          <button
            onClick={handleAddPhoto}
            className="text-xs font-bold text-rose-500 flex items-center gap-1 hover:underline"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photo</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {user.photos.map((photo, index) => (
            <div key={index} className="relative rounded-2xl overflow-hidden aspect-square bg-gray-100 dark:bg-gray-700 group">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => handleDeletePhoto(index)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {user.photos.length < 6 && (
            <button
              onClick={handleAddPhoto}
              className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-2 text-gray-400 hover:text-rose-500 hover:border-rose-300 transition-colors"
            >
              <Camera className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Bio & Interests Overview */}
      <div className="p-4 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">About You</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-rose-500 flex items-center gap-1 hover:underline"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>

        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
          {user.bio}
        </p>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
            Interests & Passions
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {user.interests.map((interest, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300">
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-5 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
              Edit Profile Details
            </h3>

            {/* Bio Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Bio / About Me
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiBios}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI Polish</span>
                </button>
              </div>

              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                rows={3}
                className="w-full p-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              {/* AI Bio Suggestions list */}
              {isGeneratingBio ? (
                <p className="text-xs text-purple-600 animate-pulse mt-1">Generating clever bio options...</p>
              ) : (
                suggestedBios.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase text-purple-600">Tap to select AI Bio Option:</p>
                    {suggestedBios.map((bioOption, i) => (
                      <div
                        key={i}
                        onClick={() => { triggerHaptic('light'); setEditedBio(bioOption); }}
                        className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-xs font-medium text-purple-900 dark:text-purple-200 cursor-pointer hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-800"
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
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Job Title</label>
                <input
                  type="text"
                  value={editedJob}
                  onChange={(e) => setEditedJob(e.target.value)}
                  className="w-full p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Company</label>
                <input
                  type="text"
                  value={editedCompany}
                  onChange={(e) => setEditedCompany(e.target.value)}
                  className="w-full p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Interests (Comma separated)
              </label>
              <input
                type="text"
                value={editedInterests}
                onChange={(e) => setEditedInterests(e.target.value)}
                className="w-full p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Save Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
