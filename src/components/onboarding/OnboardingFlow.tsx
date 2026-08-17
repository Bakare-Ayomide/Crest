import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  MapPin, 
  Calendar, 
  User, 
  Camera, 
  Plus, 
  Trash2, 
  Coffee, 
  Music, 
  Mountain, 
  Palette, 
  Compass, 
  Utensils, 
  Laptop, 
  Dumbbell, 
  Disc, 
  BookOpen, 
  CheckCircle2,
  Upload,
  Flame,
  Clock,
  Navigation
} from 'lucide-react';
import { UserProfile, FilterSettings } from '../../types';
import { triggerHaptic, showNativeToast } from '../../lib/capacitor';

interface OnboardingFlowProps {
  initialData?: {
    email?: string;
    name?: string;
  };
  onComplete: (userProfile: Partial<UserProfile>, filters: Partial<FilterSettings>) => void;
}

// Full-screen cinematic human photography for every single slide
export const ONBOARDING_SLIDE_BACKGROUNDS = [
  // Slide 1: Welcome / Introduction
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=1200&q=85',
  // Slide 2: Name & Basic info (DOB, Bio)
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
  // Slide 3: Gender identity
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85',
  // Slide 4: Who you want to meet
  'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85',
  // Slide 5: Age preferences
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85',
  // Slide 6: Location & Distance
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=85',
  // Slide 7: Interests & Passions
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85',
  // Slide 8: Dating intentions
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85',
  // Slide 9: Profile photos
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
  // Slide 10: Ready / Start Discovering
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=85'
];

export const ONBOARDING_PASSIONS = [
  { id: 'Specialty Coffee', label: 'Specialty Coffee', icon: Coffee },
  { id: 'Indie Music', label: 'Indie Music', icon: Music },
  { id: 'Hiking & Outdoors', label: 'Hiking & Outdoors', icon: Mountain },
  { id: 'Modern Art', label: 'Modern Art', icon: Palette },
  { id: 'Photography', label: 'Photography', icon: Camera },
  { id: 'Travel & Roadtrips', label: 'Travel & Roadtrips', icon: Compass },
  { id: 'Foodie & Wine', label: 'Foodie & Wine', icon: Utensils },
  { id: 'Fitness & Gym', label: 'Fitness & Gym', icon: Dumbbell },
  { id: 'Tech & Startups', label: 'Tech & Startups', icon: Laptop },
  { id: 'Vinyl Records', label: 'Vinyl Records', icon: Disc },
  { id: 'Reading & Cafes', label: 'Reading & Cafes', icon: BookOpen },
  { id: 'Fashion & Design', label: 'Fashion & Design', icon: Sparkles }
];

export const CURATED_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialData,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 10;

  // Real Account Data State
  const [name, setName] = useState(initialData?.name || 'Alex Morgan');
  const [birthDate, setBirthDate] = useState('1998-06-15');
  const [calculatedAge, setCalculatedAge] = useState(26);
  const [gender, setGender] = useState<'female' | 'male' | 'nonbinary' | 'other'>('male');
  const [bio, setBio] = useState('Looking for genuine conversations, live indie music, and the best espresso in town.');
  
  // Dating Intentions
  const [lookingFor, setLookingFor] = useState<string>('Long-term relationship');
  
  // Selected Passions (min 3)
  const [selectedPassions, setSelectedPassions] = useState<string[]>([
    'Specialty Coffee',
    'Indie Music',
    'Hiking & Outdoors',
    'Photography'
  ]);

  // Discovery Preferences
  const [genderPreference, setGenderPreference] = useState<'everyone' | 'women' | 'men' | 'nonbinary'>('everyone');
  const [ageRange, setAgeRange] = useState<[number, number]>([21, 35]);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(25);
  const [locationName, setLocationName] = useState('San Francisco, CA');

  // Photos
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80'
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Update calculated age on birth date change
  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    const birth = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    setCalculatedAge(isNaN(age) ? 24 : Math.max(18, age));
  };

  const handleTogglePassion = (passionId: string) => {
    triggerHaptic('light');
    setSelectedPassions(prev => {
      if (prev.includes(passionId)) {
        return prev.filter(p => p !== passionId);
      }
      return [...prev, passionId];
    });
  };

  const handleAddPresetPhoto = (url: string) => {
    triggerHaptic('light');
    if (photos.includes(url)) {
      showNativeToast('Photo already selected');
      return;
    }
    if (photos.length >= 6) {
      showNativeToast('Maximum 6 photos allowed');
      return;
    }
    setPhotos(prev => [...prev, url]);
  };

  const handleRemovePhoto = (index: number) => {
    triggerHaptic('medium');
    if (photos.length <= 1) {
      showNativeToast('You must keep at least 1 profile photo');
      return;
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          triggerHaptic('success');
          setPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const validateCurrentStep = (): boolean => {
    setValidationError(null);
    if (currentStep === 2) {
      if (!name.trim()) {
        setValidationError('Please enter your first name');
        triggerHaptic('heavy');
        return false;
      }
      if (calculatedAge < 18) {
        setValidationError('You must be at least 18 years old to join CREST');
        triggerHaptic('heavy');
        return false;
      }
    }
    if (currentStep === 7) {
      if (selectedPassions.length < 3) {
        setValidationError('Please select at least 3 passions');
        triggerHaptic('heavy');
        return false;
      }
    }
    if (currentStep === 9) {
      if (photos.length < 1) {
        setValidationError('Please add at least one photo to continue');
        triggerHaptic('heavy');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    triggerHaptic('medium');

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinalComplete();
    }
  };

  const handleBack = () => {
    triggerHaptic('light');
    setValidationError(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinalComplete = () => {
    triggerHaptic('success');
    
    const userProfileUpdates: Partial<UserProfile> = {
      name: name.trim() || 'Alex Morgan',
      age: calculatedAge,
      gender,
      bio: bio.trim(),
      photos: photos.length > 0 ? photos : CURATED_AVATAR_PRESETS.slice(0, 2),
      passions: selectedPassions,
      lookingFor,
      city: locationName,
      location: locationName,
      verified: true,
      verifiedBadge: true
    };

    const filterUpdates: Partial<FilterSettings> = {
      genderPreference,
      ageRange,
      maxDistanceKm,
      locationName,
      selectedPassions,
      lookingForFilter: [lookingFor]
    };

    onComplete(userProfileUpdates, filterUpdates);
  };

  const currentBgImage = ONBOARDING_SLIDE_BACKGROUNDS[currentStep - 1] || ONBOARDING_SLIDE_BACKGROUNDS[0];

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* 1. CINEMATIC FULL-SCREEN PHOTOGRAPH BACKGROUND (Edge-to-Edge, 100% viewport) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentStep}
            src={currentBgImage}
            alt="CREST Lifestyle"
            className="w-full h-full object-cover object-center"
            initial={{ scale: 1.08, opacity: 0.25 }}
            animate={{ scale: 1.0, opacity: 1 }}
            exit={{ opacity: 0.2 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </AnimatePresence>

        {/* 2. SMOOTH DEEP DARK GRADIENT FROM BOTTOM UPWARD */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 via-black/45 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* TOP BAR: STEP SEGMENTED INDICATOR & BACK BUTTON */}
      <div className="relative z-10 w-full pt-5 px-5 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="text-[11px] font-black tracking-widest text-white">CREST INTRO</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-300">
            <span>Step {currentStep} of {totalSteps}</span>
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="w-full flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isCompleted = idx + 1 < currentStep;
            const isCurrent = idx + 1 === currentStep;
            return (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                    : isCurrent
                    ? 'bg-rose-500 shadow-sm shadow-rose-500'
                    : 'bg-white/20'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 3. ALL INTERACTIVE CONTENT LIVES IN THE BOTTOM AREA */}
      <div className="relative z-10 mt-auto w-full px-5 pb-8 pt-4 flex flex-col justify-end">
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-2.5 rounded-xl bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 backdrop-blur-md"
          >
            <span>{validationError}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* SLIDE 1: WELCOME & INTENTIONAL COMMUNITY */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-rose-300 text-xs font-bold">
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>Welcome to CREST</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Where Genuine Chemistry Begins.
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Join verified singles for intentional matchmaking, shared lifestyle values, and spontaneous dates.
                </p>
              </div>

              {/* Navigation Button */}
              <div className="pt-2">
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Build My Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 2: NAME & BASIC PROFILE INFO */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">What's your name?</h2>
                <p className="text-xs text-gray-300">This is how your matches will know you</p>
              </div>

              <div className="space-y-2">
                {/* Name Input */}
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your first name"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400 transition-colors"
                  />
                </div>

                {/* Birth Date & Live Age Badge */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => handleBirthDateChange(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl text-white text-xs focus:outline-none focus:border-rose-400"
                    />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl text-xs text-gray-300">
                    <span>Age:</span>
                    <span className="font-extrabold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-lg">
                      {calculatedAge} yrs old
                    </span>
                  </div>
                </div>

                {/* Short Bio */}
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Share a fun short bio..."
                  className="w-full px-3.5 py-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 text-xs focus:outline-none focus:border-rose-400 resize-none"
                />
              </div>

              {/* Navigation */}
              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 3: GENDER IDENTITY */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3.5"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How do you identify?</h2>
                <p className="text-xs text-gray-300">Choose the gender identity that best represents you</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'female', label: 'Woman' },
                  { id: 'male', label: 'Man' },
                  { id: 'nonbinary', label: 'Non-Binary' },
                  { id: 'other', label: 'Beyond Binary' }
                ].map((item) => {
                  const isSelected = gender === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setGender(item.id as any);
                      }}
                      className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-950/50 scale-[1.02]'
                          : 'bg-black/60 backdrop-blur-md border border-white/20 text-gray-200 hover:bg-black/80'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 4: WHO YOU WANT TO MEET */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3.5"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Who are you looking for?</h2>
                <p className="text-xs text-gray-300">We'll calibrate your discovery feed accordingly</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'women', label: 'Women' },
                  { id: 'men', label: 'Men' },
                  { id: 'everyone', label: 'Everyone' },
                  { id: 'nonbinary', label: 'Non-Binary' }
                ].map((item) => {
                  const isSelected = genderPreference === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setGenderPreference(item.id as any);
                      }}
                      className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-950/50 scale-[1.02]'
                          : 'bg-black/60 backdrop-blur-md border border-white/20 text-gray-200 hover:bg-black/80'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 5: AGE PREFERENCES */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3.5"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Preferred Age Range</h2>
                <p className="text-xs text-gray-300">Set the age spectrum for prospective matches</p>
              </div>

              <div className="p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-200 font-bold">
                  <span>Age Interval:</span>
                  <span className="text-sm font-extrabold text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-xl">
                    {ageRange[0]} - {ageRange[1]} years
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>Minimum: {ageRange[0]}</span>
                    <span>Maximum: {ageRange[1]}</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="65"
                    value={ageRange[1]}
                    onChange={(e) => {
                      const maxVal = parseInt(e.target.value);
                      setAgeRange([Math.min(ageRange[0], maxVal - 1), maxVal]);
                    }}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 6: LOCATION & DISCOVERY DISTANCE */}
          {/* ========================================================================= */}
          {currentStep === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Where are you based?</h2>
                <p className="text-xs text-gray-300">Find singles near your neighborhood or city</p>
              </div>

              <div className="space-y-2">
                {/* Location Input */}
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400 pointer-events-none" />
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="City, State"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>

                {/* Distance Slider */}
                <div className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-200">
                    <span className="font-semibold">Maximum Distance:</span>
                    <span className="font-extrabold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-lg">
                      {maxDistanceKm} km ({Math.round(maxDistanceKm * 0.621)} mi)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="150"
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(parseInt(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 7: INTERESTS & PASSIONS */}
          {/* ========================================================================= */}
          {currentStep === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">What gets you excited?</h2>
                  <p className="text-xs text-gray-300">Select at least 3 passions ({selectedPassions.length} chosen)</p>
                </div>
              </div>

              {/* Chips Grid */}
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-none">
                {ONBOARDING_PASSIONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedPassions.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTogglePassion(item.id)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                          : 'bg-black/60 backdrop-blur-md border border-white/20 text-gray-300 hover:bg-black/80'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-rose-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 8: DATING INTENTIONS */}
          {/* ========================================================================= */}
          {currentStep === 8 && (
            <motion.div
              key="step-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Dating intentions</h2>
                <p className="text-xs text-gray-300">Be clear so matches align with your goals</p>
              </div>

              <div className="space-y-1.5">
                {[
                  { id: 'Long-term relationship', label: 'Long-term relationship', desc: 'Looking for a committed partner' },
                  { id: 'Relationship leading to marriage', label: 'Marriage Minded', desc: 'Ready for lifelong partnership' },
                  { id: 'Casual dating & fun', label: 'Casual Dating & Fun', desc: 'Going with the flow & exciting dates' },
                  { id: 'New friends & networking', label: 'New Friends', desc: 'Expanding my social circle' },
                  { id: 'Still figuring it out', label: 'Still Figuring It Out', desc: 'Open to whatever clicks naturally' }
                ].map((item) => {
                  const isSelected = lookingFor === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setLookingFor(item.id);
                      }}
                      className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg scale-[1.01]'
                          : 'bg-black/60 backdrop-blur-md border border-white/20 text-gray-200 hover:bg-black/80'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-rose-100' : 'text-gray-400'}`}>
                          {item.desc}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 9: PROFILE PHOTOS */}
          {/* ========================================================================= */}
          {currentStep === 9 && (
            <motion.div
              key="step-9"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-white">Add your best photos</h2>
                <p className="text-xs text-gray-300">Profiles with multiple photos receive 4x more matches</p>
              </div>

              {/* Selected photos strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative w-14 h-18 rounded-xl overflow-hidden shrink-0 border border-white/30 group">
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-rose-500 text-[8px] font-bold text-white text-center py-0.5">
                        Main
                      </span>
                    )}
                    {photos.length > 1 && (
                      <button
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {/* Upload Button */}
                <label className="w-14 h-18 rounded-xl border-2 border-dashed border-rose-400/50 bg-rose-500/10 flex flex-col items-center justify-center cursor-pointer hover:bg-rose-500/20 shrink-0">
                  <Upload className="w-4 h-4 text-rose-300" />
                  <span className="text-[9px] text-rose-300 font-bold mt-1">Upload</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* One-click curated presets */}
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400">Or add 1-click model portraits:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {CURATED_AVATAR_PRESETS.map((presetUrl, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddPresetPhoto(presetUrl)}
                      className="w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/20 hover:ring-rose-400 transition-all"
                    >
                      <img src={presetUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Continue to Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* SLIDE 10: READY / START DISCOVERING */}
          {/* ========================================================================= */}
          {currentStep === 10 && (
            <motion.div
              key="step-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3.5"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Profile Verified & Ready</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  You're Ready to Spark, {name.split(' ')[0]}!
                </h2>
                <p className="text-xs text-gray-300">
                  Your preferences are calibrated. Start exploring curated verified singles in {locationName}.
                </p>
              </div>

              {/* Mini User Summary Card */}
              <div className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-3">
                <img
                  src={photos[0] || CURATED_AVATAR_PRESETS[0]}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <span>{name}, {calculatedAge}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  </div>
                  <div className="text-[11px] text-gray-300 truncate">
                    {lookingFor} • {locationName}
                  </div>
                </div>
              </div>

              {/* Primary Final CTA */}
              <button
                onClick={handleFinalComplete}
                className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black rounded-2xl text-sm shadow-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <Flame className="w-4 h-4 fill-white" />
                <span>Launch CREST Discovery</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
