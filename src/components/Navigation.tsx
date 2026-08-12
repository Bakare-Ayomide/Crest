import React from 'react';
import { Flame, Heart, MessageCircle, User, ShieldAlert, Sparkles, Bell, SlidersHorizontal, Smartphone, Users, Zap } from 'lucide-react';
import { triggerHaptic } from '../lib/capacitor';

interface NavigationProps {
  activeTab: 'discover' | 'likes' | 'matches' | 'profile' | 'admin';
  setActiveTab: (tab: 'discover' | 'likes' | 'matches' | 'profile' | 'admin') => void;
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  onOpenNotifications: () => void;
  onOpenFilters: () => void;
  onOpenSubscription: () => void;
  isNativeDeviceFrame: boolean;
  setIsNativeDeviceFrame: (val: boolean | ((prev: boolean) => boolean)) => void;
  isGold: boolean;
  isAdmin: boolean;
}

export const Header: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenFilters,
  onOpenSubscription,
  isNativeDeviceFrame,
  setIsNativeDeviceFrame,
  isGold,
  isAdmin
}) => {
  // Hide top app header on discover tab because discover has its own dedicated top header bar
  if (activeTab === 'discover') return null;

  return (
    <header className="sticky top-0 z-30 bg-[#101112]/90 backdrop-blur-md border-b border-white/5 px-4 py-3 transition-colors text-white">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => { triggerHaptic('light'); setActiveTab('discover'); }}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 bg-clip-text text-transparent">
              CREST
            </span>
            {isGold && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-950/80 text-amber-400 rounded-md border border-amber-700 uppercase tracking-wider">
                GOLD
              </span>
            )}
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1.5">
          {!isGold && (
            <button
              onClick={() => { triggerHaptic('medium'); onOpenSubscription(); }}
              className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 text-xs font-bold shadow-sm hover:shadow-md flex items-center gap-1 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-gray-900" />
              <span>Get Gold</span>
            </button>
          )}

          <button
            onClick={() => { triggerHaptic('light'); setIsNativeDeviceFrame(prev => !prev); }}
            title="Toggle Device Frame"
            className={`p-2 rounded-xl transition-colors ${
              isNativeDeviceFrame 
                ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40' 
                : 'text-gray-400 hover:bg-white/10'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </button>

          <button
            onClick={() => { triggerHaptic('light'); onOpenFilters(); }}
            className="p-2 rounded-xl text-gray-300 hover:bg-white/10 transition-colors"
            title="Discovery Preferences"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          <button
            onClick={() => { triggerHaptic('light'); onOpenNotifications(); }}
            className="p-2 rounded-xl text-gray-300 hover:bg-white/10 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-black animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export const BottomNav: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  unreadMessagesCount,
  isAdmin
}) => {
  // Standard bar for non-discover tabs
  if (activeTab !== 'discover') {
    const tabs = [
      { id: 'discover', label: 'Discover', icon: Flame },
      { id: 'likes', label: 'Likes', icon: Heart },
      { id: 'matches', label: 'Chat', icon: MessageCircle, badge: unreadMessagesCount },
      { id: 'profile', label: 'Profile', icon: User },
    ];

    if (isAdmin) {
      tabs.push({ id: 'admin', label: 'Admin', icon: ShieldAlert });
    }

    return (
      <nav className="sticky bottom-0 left-0 right-0 z-40 bg-[#101112]/95 backdrop-blur-lg border-t border-white/5 px-3 py-2 text-white">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('light');
                  setActiveTab(tab.id as any);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-200 ${
                  isActive
                    ? 'text-rose-400 font-semibold scale-105'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.2px]' : 'stroke-[1.8px]'}`} />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-black">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] mt-0.5 font-medium">{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // DISCOVER TAB SPEC-COMPLIANT BOTTOM NAVIGATION
  return (
    <nav className="absolute bottom-2 left-0 right-0 z-40 px-4 py-2 bg-transparent pointer-events-auto">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Outlined Pill for PEOPLE */}
        <button
          onClick={() => { triggerHaptic('light'); setActiveTab('discover'); }}
          className="flex-1 py-3 px-4 rounded-[30px] bg-[#171819]/90 border border-white/15 text-white flex items-center justify-center gap-2.5 shadow-lg backdrop-blur-md active:scale-95 transition-transform"
        >
          <Users className="w-4 h-4 text-white" />
          <span className="text-xs font-bold uppercase tracking-widest text-white">PEOPLE</span>
        </button>

        {/* Center: Circular Message Button with pink notification indicator */}
        <button
          onClick={() => { triggerHaptic('light'); setActiveTab('matches'); }}
          className="w-12 h-12 rounded-full bg-[#171819]/90 border border-white/10 text-white flex items-center justify-center shadow-lg backdrop-blur-md relative active:scale-95 transition-transform shrink-0"
          title="Messages / Chat"
        >
          <MessageCircle className="w-5 h-5 text-gray-200 fill-gray-200/20" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#E98BD0] ring-2 ring-[#101112]" />
        </button>

        {/* Right: Pill for MY DATES */}
        <button
          onClick={() => { triggerHaptic('light'); setActiveTab('likes'); }}
          className="flex-1 py-3 px-4 rounded-[30px] bg-[#171819]/90 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center gap-2.5 shadow-lg backdrop-blur-md active:scale-95 transition-transform"
        >
          <Zap className="w-4 h-4 text-gray-300" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-300">MY DATES</span>
        </button>
      </div>
    </nav>
  );
};
