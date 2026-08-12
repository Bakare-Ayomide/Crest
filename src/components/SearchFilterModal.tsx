import React, { useState } from 'react';
import { SlidersHorizontal, Check, X, ShieldCheck, Camera } from 'lucide-react';
import { FilterSettings } from '../types';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

interface SearchFilterModalProps {
  filters: FilterSettings;
  onApplyFilters: (newFilters: FilterSettings) => void;
  onClose: () => void;
}

export const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
  filters,
  onApplyFilters,
  onClose
}) => {
  const [distance, setDistance] = useState(filters.maxDistanceKm);
  const [minAge, setMinAge] = useState(filters.ageRange[0]);
  const [maxAge, setMaxAge] = useState(filters.ageRange[1]);
  const [gender, setGender] = useState(filters.genderPreference);
  const [verifiedOnly, setVerifiedOnly] = useState(filters.verifiedOnly);
  const [lookingFor, setLookingFor] = useState(filters.lookingForFilter);

  const ALL_PASSIONS = [
    'Specialty Coffee', 'Hiking', 'Indie Music', 'Photography', 'Pottery',
    'Surfing', 'Board Games', 'Vinyl Records', 'Yoga', 'Travel', 'Natural Wine'
  ];
  const [selectedPassions, setSelectedPassions] = useState<string[]>(filters.selectedPassions);

  const togglePassion = (p: string) => {
    triggerHaptic('light');
    if (selectedPassions.includes(p)) {
      setSelectedPassions(prev => prev.filter(item => item !== p));
    } else {
      setSelectedPassions(prev => [...prev, p]);
    }
  };

  const handleApply = () => {
    triggerHaptic('success');
    onApplyFilters({
      maxDistanceKm: distance,
      ageRange: [minAge, maxAge],
      genderPreference: gender,
      verifiedOnly,
      hasPhotosOnly: true,
      lookingForFilter: lookingFor,
      selectedPassions
    });
    showNativeToast('Discovery preferences updated!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-5 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-gray-900 dark:text-white">
            <SlidersHorizontal className="w-5 h-5 text-rose-500" />
            <span>Discovery Preferences</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Distance Radius */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-700 dark:text-gray-300">Maximum Distance</span>
            <span className="text-rose-500">{distance} km</span>
          </div>
          <input
            type="range"
            min={2}
            max={100}
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Age Range Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-gray-700 dark:text-gray-300">Age Range</span>
            <span className="text-rose-500">{minAge} - {maxAge} years</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={18}
              max={65}
              value={minAge}
              onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <input
              type="range"
              min={18}
              max={65}
              value={maxAge}
              onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Show Me / Gender */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            Interested In
          </label>
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            {[
              { id: 'everyone', label: 'All' },
              { id: 'women', label: 'Women' },
              { id: 'men', label: 'Men' },
              { id: 'nonbinary', label: 'Non-binary' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => { triggerHaptic('light'); setGender(g.id as any); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  gender === g.id
                    ? 'bg-white dark:bg-gray-900 text-rose-500 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Verified Profiles Only</span>
            </div>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Passion Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            Filter Passions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_PASSIONS.map((p, i) => {
              const isSelected = selectedPassions.includes(p);
              return (
                <button
                  key={i}
                  onClick={() => togglePassion(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
