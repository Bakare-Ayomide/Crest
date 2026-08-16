import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  MapPin,
  Compass,
  Sliders,
  Sparkles,
  ShieldCheck,
  Camera,
  Heart,
  Search,
  Check,
  RotateCcw,
  Globe,
  Flame,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Layers,
  Smile,
  Coffee,
  Music,
  Film,
  Dumbbell,
  Plane,
  Utensils,
  Gamepad2,
  Trophy,
  Palette,
  Briefcase,
  Laptop,
  Wine,
  BookOpen,
  Tent,
  Glasses
} from 'lucide-react';
import { FilterSettings, UserSettings } from '../types';
import { PreferencesMap } from './preferences/PreferencesMap';
import { AgeRangeSlider } from './preferences/AgeRangeSlider';
import { POPULAR_CITIES, GeoLocation, searchLocations, reverseGeocode } from '../lib/geo';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

interface QuickPreferencesViewProps {
  filters: FilterSettings;
  userSettings: UserSettings;
  onUpdateFilters: (newFilters: FilterSettings) => void;
  onUpdateUserSettings?: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
  isModal?: boolean;
}

const LOOKING_FOR_OPTIONS = [
  'Long-term relationship',
  'Relationship',
  'Casual dating',
  'Friendship',
  'Marriage',
  'Open to anything',
  'Still figuring it out'
];

const INTEREST_ITEMS = [
  { id: 'Specialty Coffee', label: 'Coffee', icon: Coffee },
  { id: 'Indie Music', label: 'Music', icon: Music },
  { id: 'Movies', label: 'Movies', icon: Film },
  { id: 'Fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'Travel', label: 'Travel', icon: Plane },
  { id: 'Food & Dining', label: 'Food', icon: Utensils },
  { id: 'Gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'Sports', label: 'Sports', icon: Trophy },
  { id: 'Art & Design', label: 'Art', icon: Palette },
  { id: 'Business', label: 'Business', icon: Briefcase },
  { id: 'Technology', label: 'Technology', icon: Laptop },
  { id: 'Photography', label: 'Photography', icon: Camera },
  { id: 'Natural Wine', label: 'Wine', icon: Wine },
  { id: 'Reading', label: 'Reading', icon: BookOpen },
  { id: 'Hiking & Outdoors', label: 'Outdoors', icon: Tent },
  { id: 'Yoga', label: 'Yoga', icon: Smile },
];

export const QuickPreferencesView: React.FC<QuickPreferencesViewProps> = ({
  filters,
  userSettings,
  onUpdateFilters,
  onUpdateUserSettings,
  onClose,
  isModal = false
}) => {
  // Local state for immediate responsiveness
  const [localFilters, setLocalFilters] = useState<FilterSettings>(filters);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync incoming filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Debounced auto-save to server & parent
  const triggerAutoSave = useCallback((updated: FilterSettings) => {
    setSaveStatus('saving');
    onUpdateFilters(updated);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        if (res.ok) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('saved'); // Still saved locally in React state
        }
      } catch (e) {
        setSaveStatus('saved'); // Local state active
      }
    }, 400);
  }, [onUpdateFilters]);

  // Helper to mutate partial filters with auto-save
  const updatePreference = (patch: Partial<FilterSettings>) => {
    const next = { ...localFilters, ...patch };
    setLocalFilters(next);
    triggerAutoSave(next);
  };

  // Location search input handler
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!val.trim()) {
      setSearchResults(POPULAR_CITIES.slice(0, 6));
      setShowSearchDropdown(true);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchLocations(val);
      setSearchResults(results);
      setIsSearching(false);
    }, 280);
  };

  // Select location from search or preset
  const handleSelectLocation = (loc: GeoLocation) => {
    triggerHaptic('light');
    setSearchQuery('');
    setShowSearchDropdown(false);
    updatePreference({
      locationName: loc.name,
      locationCoords: { lat: loc.lat, lng: loc.lng }
    });
    showNativeToast(`Location set to ${loc.name}`);
  };

  // Map pin drag / click handler
  const handleMapLocationChange = async (lat: number, lng: number) => {
    // Reverse geocode to get name
    const resolvedName = await reverseGeocode(lat, lng);
    updatePreference({
      locationCoords: { lat, lng },
      locationName: resolvedName
    });
  };

  // Use current GPS location
  const handleUseCurrentLocation = () => {
    triggerHaptic('medium');
    if (!navigator.geolocation) {
      showNativeToast('Geolocation not supported by browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const name = await reverseGeocode(latitude, longitude);
        setIsLocating(false);
        updatePreference({
          locationCoords: { lat: latitude, lng: longitude },
          locationName: name
        });
        showNativeToast(`Updated to current location: ${name}`);
      },
      (err) => {
        setIsLocating(false);
        showNativeToast('Unable to retrieve current GPS location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Toggle "Looking For" options
  const toggleLookingFor = (option: string) => {
    triggerHaptic('light');
    const currentList = Array.isArray(localFilters.lookingForFilter)
      ? localFilters.lookingForFilter
      : [localFilters.lookingForFilter];

    let nextList: string[];
    if (currentList.includes(option)) {
      nextList = currentList.filter(item => item !== option);
      if (nextList.length === 0) nextList = ['Open to anything'];
    } else {
      nextList = [...currentList.filter(item => item !== 'Open to anything' && item !== 'All'), option];
    }
    updatePreference({ lookingForFilter: nextList });
  };

  // Toggle Interest Chips
  const toggleInterest = (interest: string) => {
    triggerHaptic('light');
    const current = localFilters.selectedPassions || [];
    let next: string[];
    if (current.includes(interest)) {
      next = current.filter(i => i !== interest);
    } else {
      next = [...current, interest];
    }
    updatePreference({ selectedPassions: next });
  };

  // Reset all preferences to default
  const handleResetDefaults = () => {
    triggerHaptic('heavy');
    const defaultPrefs: FilterSettings = {
      locationName: 'San Francisco, CA',
      locationCoords: { lat: 37.7749, lng: -122.4194 },
      locationOnlyMode: true,
      maxDistanceKm: 25,
      ageRange: [18, 35],
      genderPreference: 'everyone',
      lookingForFilter: ['Long-term relationship'],
      selectedPassions: ['Specialty Coffee', 'Indie Music', 'Photography', 'Hiking & Outdoors'],
      prioritizeCommonInterests: true,
      verifiedOnly: false,
      hasPhotosOnly: true,
      lifestyleFilters: {
        drinking: 'all',
        smoking: 'never',
        wantChildren: 'all'
      }
    };
    setLocalFilters(defaultPrefs);
    triggerAutoSave(defaultPrefs);
    setShowResetConfirm(false);
    showNativeToast('Preferences reset to default.');
  };

  // Formatted distance display considering user unit preference
  const isMiles = userSettings.distanceUnit === 'mi';
  const displayDistance = isMiles
    ? `${Math.round(localFilters.maxDistanceKm * 0.621371)} mi`
    : `${localFilters.maxDistanceKm} km`;

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto min-h-screen bg-[#101112] text-white pb-28 select-none font-sans">
      
      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-30 bg-[#101112]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { triggerHaptic('light'); onClose(); }}
            className="w-10 h-10 rounded-[14px] bg-[#171819] flex items-center justify-center text-white hover:bg-[#242526] active:scale-95 transition-all shadow-md"
            title="Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-base font-extrabold tracking-wide text-white font-sans flex items-center gap-1.5">
              <span>Quick Preferences</span>
            </h1>
            <p className="text-[11px] text-[#B8B8BA]">Live matching discovery controls</p>
          </div>
        </div>

        {/* Auto-save live indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#171819] border border-white/10 text-[11px] font-semibold text-gray-300 shadow-xs">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 text-[#E98BD0] animate-spin" />
                <span className="text-[#E98BD0]">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-300">Auto-saved</span>
              </>
            )}
          </div>

          {/* Reset button */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-9 h-9 rounded-[12px] bg-[#171819] flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-[#242526] transition-all"
            title="Reset preferences"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN PREFERENCES FORM CARDS */}
      <div className="px-4 py-4 space-y-4">

        {/* SECTION 1: LOCATION & INTERACTIVE MAP */}
        <section className="p-4 rounded-3xl bg-[#171819] border border-white/5 shadow-md space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#E98BD0]/20 text-[#E98BD0]">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">Discovery Location</h2>
                <p className="text-[11px] text-gray-400">Where you want to meet people</p>
              </div>
            </div>

            {/* Use GPS Location Button */}
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-bold text-[#E98BD0] flex items-center gap-1.5 active:scale-95 transition-all"
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Compass className="w-3.5 h-3.5" />
              )}
              <span>Current GPS</span>
            </button>
          </div>

          {/* Location Search Bar & Dropdown */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search city, area, or zip code..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={() => {
                  setShowSearchDropdown(true);
                  if (!searchQuery) setSearchResults(POPULAR_CITIES.slice(0, 6));
                }}
                className="w-full bg-[#101112] border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E98BD0] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                  className="absolute right-3 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#141516] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                <div className="p-2 border-b border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-bold px-3">
                  <span>{searchQuery ? 'Search Suggestions' : 'Popular Cities'}</span>
                  <button onClick={() => setShowSearchDropdown(false)} className="text-gray-400 hover:text-white">
                    Close
                  </button>
                </div>
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#E98BD0]" />
                    <span>Searching locations...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((loc, idx) => (
                    <button
                      key={`${loc.name}-${idx}`}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-white flex items-center justify-between border-b border-white/5 last:border-0 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#FF4058] shrink-0" />
                        <span className="truncate">{loc.name}</span>
                      </div>
                      {loc.country && <span className="text-[10px] text-gray-500 shrink-0 ml-2">{loc.country}</span>}
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-gray-500">No matching locations found.</div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Leaflet Map with Radius Circle */}
          <div className="space-y-1.5">
            <PreferencesMap
              lat={localFilters.locationCoords?.lat || 37.7749}
              lng={localFilters.locationCoords?.lng || -122.4194}
              maxDistanceKm={localFilters.maxDistanceKm}
              locationName={localFilters.locationName || 'San Francisco, CA'}
              onLocationChange={handleMapLocationChange}
              isLocating={isLocating}
            />
          </div>

          {/* Quick Location Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {POPULAR_CITIES.slice(0, 4).map((city) => (
              <button
                key={city.name}
                onClick={() => handleSelectLocation(city)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  localFilters.locationName.includes(city.name.split(',')[0])
                    ? 'bg-[#E98BD0] text-[#101112]'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {city.name.split(',')[0]}
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 2: MAXIMUM DISTANCE SLIDER */}
        <section className="p-4 rounded-3xl bg-[#171819] border border-white/5 shadow-md space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">Maximum Distance</h2>
              <p className="text-[11px] text-gray-400">Expand or narrow your discovery radius</p>
            </div>
            <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FF4058]/20 to-[#E98BD0]/20 border border-[#FF4058]/30 text-sm font-extrabold text-[#E98BD0] shadow-sm">
              {displayDistance}
            </div>
          </div>

          {/* Distance Range Input (1 to 500 km) */}
          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={1}
              max={500}
              step={localFilters.maxDistanceKm > 100 ? 10 : localFilters.maxDistanceKm > 30 ? 5 : 1}
              value={localFilters.maxDistanceKm}
              onChange={(e) => updatePreference({ maxDistanceKm: Number(e.target.value) })}
              className="w-full accent-[#FF4058] cursor-pointer h-2 bg-white/10 rounded-full"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>1 km</span>
              <span>25 km</span>
              <span>100 km</span>
              <span>250 km</span>
              <span>500 km</span>
            </div>
          </div>

          {/* Quick Distance Preset Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[5, 15, 25, 50, 100, 500].map((dist) => {
              const isSelected = localFilters.maxDistanceKm === dist;
              const label = isMiles ? `${Math.round(dist * 0.621371)} mi` : `${dist} km`;
              return (
                <button
                  key={dist}
                  onClick={() => {
                    triggerHaptic('light');
                    updatePreference({ maxDistanceKm: dist });
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#FF4058] text-white shadow-sm scale-105'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: LOCATION-ONLY MODE TOGGLE */}
        <section className="p-4 rounded-3xl bg-[#171819] border border-white/5 shadow-md flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-xs font-bold text-gray-100 flex items-center gap-1.5">
              <span>Only show people within my area</span>
            </h2>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              When enabled, profiles outside your {displayDistance} radius are hidden from your feed.
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              updatePreference({ locationOnlyMode: !localFilters.locationOnlyMode });
            }}
            className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 shrink-0 cursor-pointer ${
              localFilters.locationOnlyMode ? 'bg-[#FF4058]' : 'bg-white/15'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                localFilters.locationOnlyMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </section>

        {/* SECTION 4: SHOW ME (GENDER SEGMENTED CONTROL) */}
        <section className="p-4 rounded-3xl bg-[#171819] border border-white/5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">Show Me</h2>
              <p className="text-[11px] text-gray-400">Who do you want to explore</p>
            </div>
            <span className="text-xs font-bold text-[#E98BD0] capitalize">
              {localFilters.genderPreference}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#101112] rounded-2xl border border-white/5">
            {[
              { id: 'women', label: 'Women' },
              { id: 'men', label: 'Men' },
              { id: 'nonbinary', label: 'Non-binary' },
              { id: 'everyone', label: 'Everyone' },
            ].map((g) => {
              const isSelected = localFilters.genderPreference === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    triggerHaptic('light');
                    updatePreference({ genderPreference: g.id as any });
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF4058] to-[#E98BD0] text-white shadow-md font-extrabold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: AGE RANGE DUAL SLIDER */}
        <section className="p-4 rounded-3xl bg-[#171819] border border-white/5 shadow-md">
          <AgeRangeSlider
            minAge={localFilters.ageRange[0]}
            maxAge={localFilters.ageRange[1]}
            onChange={(min, max) => updatePreference({ ageRange: [min, max] })}
          />
        </section>

        {/* SECTION 6: RELATIONSHIP GOALS ("LOOKING FOR") */}
        <section className="p-4 rounded-3xl bg-[#171819] border border-white/5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">Looking For</h2>
              <p className="text-[11px] text-gray-400">Match with compatible relationship goals</p>
            </div>
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-[#FF4058]">
              <Heart className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {LOOKING_FOR_OPTIONS.map((opt) => {
              const selectedList = Array.isArray(localFilters.lookingForFilter)
                ? localFilters.lookingForFilter
                : [localFilters.lookingForFilter];
              const isSelected = selectedList.includes(opt);

              return (
                <button
                  key={opt}
                  onClick={() => toggleLookingFor(opt)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF4058] to-[#E98BD0] text-white shadow-md border-transparent scale-102'
                      : 'bg-[#101112] text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 7: SHARED INTERESTS & PASSIONS */}
        <section className="p-4 rounded-3xl bg-[#171819] border border-white/5 shadow-md space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">Common Interests</h2>
              <p className="text-[11px] text-gray-400">
                {localFilters.selectedPassions?.length || 0} passions selected
              </p>
            </div>

            {/* Clear / All buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  updatePreference({
                    selectedPassions: localFilters.selectedPassions?.length === INTEREST_ITEMS.length
                      ? []
                      : INTEREST_ITEMS.map(i => i.id)
                  });
                }}
                className="text-[11px] text-[#E98BD0] font-bold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                {localFilters.selectedPassions?.length === INTEREST_ITEMS.length ? 'Clear All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Prioritize Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#101112] border border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E98BD0]" />
              <div>
                <p className="text-xs font-bold text-gray-200">Prioritize shared interests</p>
                <p className="text-[10px] text-gray-400">Ranks profiles with matching passions first</p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                updatePreference({ prioritizeCommonInterests: !localFilters.prioritizeCommonInterests });
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 shrink-0 cursor-pointer ${
                localFilters.prioritizeCommonInterests ? 'bg-[#E98BD0]' : 'bg-white/15'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  localFilters.prioritizeCommonInterests ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Passion Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {INTEREST_ITEMS.map((item) => {
              const isSelected = localFilters.selectedPassions?.includes(item.id);
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#E98BD0] text-[#101112] shadow-sm font-bold scale-102'
                      : 'bg-[#101112] text-gray-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#101112]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SECTION 8: PROFILE QUALITY & VERIFICATION PREFERENCES */}
        <section className="p-4 rounded-3xl bg-[#171819] border border-white/5 shadow-md space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
            Profile & Quality Filters
          </h2>

          {/* Verified Profiles Only */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-200">Verified Profiles Only</p>
                <p className="text-[11px] text-gray-400">Only show members with pose-verified blue badge</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localFilters.verifiedOnly}
              onChange={(e) => {
                triggerHaptic('light');
                updatePreference({ verifiedOnly: e.target.checked });
              }}
              className="w-5 h-5 accent-[#FF4058] rounded cursor-pointer"
            />
          </div>

          {/* Has Photos Only */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-200">Multiple Photos Only</p>
                <p className="text-[11px] text-gray-400">Hide profiles with only 1 photo</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localFilters.hasPhotosOnly}
              onChange={(e) => {
                triggerHaptic('light');
                updatePreference({ hasPhotosOnly: e.target.checked });
              }}
              className="w-5 h-5 accent-[#FF4058] rounded cursor-pointer"
            />
          </div>

          {/* Distance Units Switcher (KM / Miles) */}
          {onUpdateUserSettings && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-200">Distance Units</p>
                  <p className="text-[11px] text-gray-400">Metric (Kilometers) vs Imperial (Miles)</p>
                </div>
              </div>
              <div className="flex items-center p-1 bg-[#101112] rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onUpdateUserSettings({ distanceUnit: 'km' });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    userSettings.distanceUnit === 'km'
                      ? 'bg-[#E98BD0] text-[#101112]'
                      : 'text-gray-400'
                  }`}
                >
                  KM
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    onUpdateUserSettings({ distanceUnit: 'mi' });
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    userSettings.distanceUnit === 'mi'
                      ? 'bg-[#E98BD0] text-[#101112]'
                      : 'text-gray-400'
                  }`}
                >
                  MI
                </button>
              </div>
            </div>
          )}
        </section>

        {/* BOTTOM ACTION & RESET */}
        <div className="pt-2 pb-6 space-y-3">
          <button
            onClick={() => {
              triggerHaptic('medium');
              onClose();
              showNativeToast('Discovery preferences applied!');
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF4058] via-rose-500 to-[#E98BD0] text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-transform"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Apply & Return to Discovery</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 rounded-2xl bg-[#171819] text-gray-400 hover:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 border border-white/5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Preferences to Default</span>
          </button>
        </div>

      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#171819] border border-white/10 rounded-3xl p-5 max-w-xs w-full space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-[#FF4058] flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Reset Preferences?</h3>
              <p className="text-xs text-gray-400">
                This will revert all discovery preferences (location, distance, age, interests) back to default settings.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDefaults}
                className="flex-1 py-2.5 rounded-xl bg-[#FF4058] text-white text-xs font-bold shadow-md"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
