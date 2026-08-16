import React from 'react';
import { UserSettings } from '../types';
import { Moon, Sun, Globe, EyeOff, Bell, Smartphone, LogOut, ChevronLeft, Shield, Sliders } from 'lucide-react';
import { triggerHaptic, showNativeToast } from '../lib/capacitor';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
  onOpenDiscoveryPreferences?: () => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onOpenDiscoveryPreferences,
  isAdmin,
  setIsAdmin
}) => {
  return (
    <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
        <button
          onClick={() => { triggerHaptic('light'); onClose(); }}
          className="flex items-center gap-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-rose-500"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Profile</span>
        </button>
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white">App Settings</h3>
      </div>

      {/* Discovery Preferences Quick Entry */}
      {onOpenDiscoveryPreferences && (
        <button
          onClick={() => { triggerHaptic('medium'); onOpenDiscoveryPreferences(); }}
          className="w-full p-4 rounded-3xl bg-gradient-to-r from-[#FF4058]/15 via-rose-500/10 to-[#E98BD0]/15 border border-[#FF4058]/30 flex items-center justify-between text-left shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#FF4058] to-[#E98BD0] text-white shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-white group-hover:text-[#E98BD0] transition-colors">
                Discovery & Matching Preferences
              </p>
              <p className="text-[11px] text-gray-400">
                Location map, distance radius, age range & passions
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-bold text-[#E98BD0]">
            Edit
          </span>
        </button>
      )}

      {/* Account Preferences */}
      <div className="p-4 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Preferences & Privacy
        </h4>

        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {settings.darkTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">Dark Theme</p>
              <p className="text-[11px] text-gray-400">Eye-friendly night mode</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.darkTheme}
            onChange={(e) => {
              triggerHaptic('light');
              onUpdateSettings({ darkTheme: e.target.checked });
            }}
            className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
          />
        </div>

        {/* Distance Unit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">Distance Units</p>
              <p className="text-[11px] text-gray-400">Kilometers vs Miles</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onUpdateSettings({ distanceUnit: settings.distanceUnit === 'km' ? 'mi' : 'km' });
            }}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 rounded-xl"
          >
            {settings.distanceUnit.toUpperCase()}
          </button>
        </div>

        {/* Incognito Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <EyeOff className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">Incognito Mode</p>
              <p className="text-[11px] text-gray-400">Only show me to people I like</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.incognitoMode}
            onChange={(e) => {
              triggerHaptic('light');
              onUpdateSettings({ incognitoMode: e.target.checked });
              showNativeToast(e.target.checked ? 'Incognito Mode Active' : 'Public Discovery Mode');
            }}
            className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Capacitor Native & Developer Mode */}
      <div className="p-4 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Mobile & Dev Tools
        </h4>

        {/* Capacitor Frame Emulation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">Capacitor Mobile Shell</p>
              <p className="text-[11px] text-gray-400">Simulate native device notch & statusbar</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.capacitorNativeMode}
            onChange={(e) => {
              triggerHaptic('medium');
              onUpdateSettings({ capacitorNativeMode: e.target.checked });
            }}
            className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
          />
        </div>

        {/* Admin Frontend Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-xs text-gray-900 dark:text-white">Admin Dashboard Access</p>
              <p className="text-[11px] text-gray-400">Enable user moderation & analytics tab</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => {
              triggerHaptic('medium');
              setIsAdmin(e.target.checked);
              showNativeToast(e.target.checked ? 'Admin Panel Activated' : 'Admin Panel Hidden');
            }}
            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Account Actions */}
      <div className="pt-2">
        <button
          onClick={() => {
            triggerHaptic('heavy');
            showNativeToast('Logged out session');
          }}
          className="w-full py-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of CREST</span>
        </button>
      </div>
    </div>
  );
};
