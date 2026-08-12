import React, { useState, useEffect } from 'react';
import { UserProfile, Match, Message, NotificationItem, FilterSettings, UserSettings, ReportTicket, VerificationRequest, SwipeDirection } from './types';
import { CURRENT_USER, MOCK_PROFILES, MOCK_MATCHES, MOCK_NOTIFICATIONS, MOCK_REPORTS, MOCK_VERIFICATION_REQUESTS } from './data/mockData';
import { Header, BottomNav } from './components/Navigation';
import { DiscoverSwipe } from './components/DiscoverSwipe';
import { LikesView } from './components/LikesView';
import { MatchesChatView } from './components/MatchesChatView';
import { ProfileView } from './components/ProfileView';
import { VerificationWizard } from './components/VerificationWizard';
import { SearchFilterModal } from './components/SearchFilterModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SettingsView } from './components/SettingsView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { AdminDashboard } from './components/AdminDashboard';
import { DeviceFrame } from './components/DeviceFrame';
import { triggerHaptic, showNativeToast } from './lib/capacitor';
import { Heart, MessageCircle, Sparkles, X, Send } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'discover' | 'likes' | 'matches' | 'profile' | 'admin'>('discover');
  
  // State
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [profiles, setProfiles] = useState<UserProfile[]>(MOCK_PROFILES);
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [reports, setReports] = useState<ReportTicket[]>(MOCK_REPORTS);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>(MOCK_VERIFICATION_REQUESTS);

  const [swipedStack, setSwipedStack] = useState<UserProfile[]>([]);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [matchCelebration, setMatchCelebration] = useState<UserProfile | null>(null);

  // Settings & Modals
  const [userSettings, setUserSettings] = useState<UserSettings>({
    darkTheme: true,
    distanceUnit: 'km',
    globalMode: false,
    showMeOnCrest: true,
    incognitoMode: false,
    pushNotifications: true,
    matchAlerts: true,
    messageAlerts: true,
    capacitorNativeMode: false,
    activeSubscriptionTier: 'free',
    boostsRemaining: 1,
    superLikesRemaining: 5
  });

  const [filters, setFilters] = useState<FilterSettings>({
    ageRange: [18, 35],
    maxDistanceKm: 25,
    genderPreference: 'everyone',
    verifiedOnly: false,
    hasPhotosOnly: true,
    lookingForFilter: 'All',
    selectedPassions: []
  });

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showVerificationWizard, setShowVerificationWizard] = useState(false);
  const [showSettingsView, setShowSettingsView] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  // Apply dark mode class to html document
  useEffect(() => {
    if (userSettings.darkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userSettings.darkTheme]);

  // Handle Swipe Action
  const handleSwipe = (profile: UserProfile, direction: SwipeDirection) => {
    setSwipedStack(prev => [...prev, profile]);

    if (direction === 'right' || direction === 'up') {
      // 70% chance of a match celebration simulation
      const isMutualMatch = profile.likedYou || profile.superLikedYou || Math.random() > 0.3;

      if (isMutualMatch) {
        setTimeout(() => {
          triggerHaptic('success');
          setMatchCelebration(profile);

          // Add to matches
          const newMatch: Match = {
            id: `match_${Date.now()}`,
            user: profile,
            matchedAt: 'Just now',
            unreadCount: 0,
            onlineStatus: 'online'
          };
          setMatches(prev => [newMatch, ...prev]);

          // Add Notification
          const newNotif: NotificationItem = {
            id: `notif_${Date.now()}`,
            type: 'match',
            title: 'It\'s a Match!',
            message: `You and ${profile.name} liked each other.`,
            timestamp: 'Just now',
            read: false,
            userAvatar: profile.photos[0],
            profileId: profile.id
          };
          setNotifications(prev => [newNotif, ...prev]);
        }, 400);
      } else {
        showNativeToast(`Liked ${profile.name}!`);
      }
    }
  };

  const handleRewind = () => {
    if (swipedStack.length === 0) return;
    const last = swipedStack[swipedStack.length - 1];
    setSwipedStack(prev => prev.slice(0, prev.length - 1));
    showNativeToast(`Rewound ${last.name}`);
  };

  const handleBoostProfile = () => {
    setIsBoostActive(true);
    showNativeToast('Profile Boost Active for 30 minutes! ⚡');
    setTimeout(() => setIsBoostActive(false), 30000);
  };

  const handleSendMessage = (matchId: string, text: string, media?: any) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      matchId,
      senderId: 'user_me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      ...media
    };

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          lastMessage: newMessage
        };
      }
      return m;
    }));

    // Simulate match reply after 2 seconds
    setTimeout(() => {
      if (!activeMatch) return;
      const replies = [
        "That's so awesome! Tell me more 😊",
        "Haha totally agree! What are you up to this weekend?",
        "Sounds like a plan! Let's get coffee ☕"
      ];
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: Message = {
        id: `reply_${Date.now()}`,
        matchId,
        senderId: activeMatch.user.id,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered'
      };

      setMatches(prevMatches => prevMatches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            lastMessage: replyMsg
          };
        }
        return m;
      }));
      triggerHaptic('light');
    }, 2200);
  };

  const handleReportProfile = (profile: UserProfile) => {
    const newReport: ReportTicket = {
      id: `rep_${Date.now()}`,
      reportedUserId: profile.id,
      reportedUserName: profile.name,
      reportedUserPhoto: profile.photos[0],
      reporterName: currentUser.name,
      reason: 'Inappropriate Content or Suspicious Profile',
      details: 'User reported profile from Discover card.',
      timestamp: new Date().toLocaleString(),
      status: 'open'
    };
    setReports(prev => [newReport, ...prev]);
    showNativeToast(`${profile.name} reported to Admin Team.`);
  };

  const handleResolveReport = (reportId: string, action: 'ban' | 'dismiss') => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action === 'ban' ? 'banned' : 'resolved' } : r));
    showNativeToast(`Report ${action === 'ban' ? 'User Banned' : 'Dismissed'}`);
  };

  const handleReviewVerification = (requestId: string, status: 'approved' | 'rejected') => {
    setVerificationRequests(prev => prev.map(v => v.id === requestId ? { ...v, status } : v));
    showNativeToast(`Verification ${status.toUpperCase()}`);
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const unreadMessagesCount = matches.reduce((acc, m) => acc + m.unreadCount, 0);

  return (
    <DeviceFrame enabled={userSettings.capacitorNativeMode}>
      <div className="relative flex flex-col h-full min-h-screen bg-[#101112] text-white transition-colors overflow-hidden">
        
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenFilters={() => setShowFilterModal(true)}
          onOpenSubscription={() => setShowSubscriptionModal(true)}
          isNativeDeviceFrame={userSettings.capacitorNativeMode}
          setIsNativeDeviceFrame={(val) => {
            const next = typeof val === 'function' ? val(userSettings.capacitorNativeMode) : val;
            setUserSettings(prev => ({ ...prev, capacitorNativeMode: next }));
          }}
          isGold={userSettings.activeSubscriptionTier !== 'free'}
          isAdmin={isAdmin}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {showSettingsView ? (
            <SettingsView
              settings={userSettings}
              onUpdateSettings={(newSet) => setUserSettings(prev => ({ ...prev, ...newSet }))}
              onClose={() => setShowSettingsView(false)}
              isAdmin={isAdmin}
              setIsAdmin={setIsAdmin}
            />
          ) : (
            <>
              {activeTab === 'discover' && (
                <DiscoverSwipe
                  profiles={profiles}
                  onSwipe={handleSwipe}
                  onRewind={handleRewind}
                  canRewind={swipedStack.length > 0}
                  onBoost={handleBoostProfile}
                  isBoostActive={isBoostActive}
                  onReportProfile={handleReportProfile}
                  onOpenFilters={() => setShowFilterModal(true)}
                  onOpenNotifications={() => setShowNotificationsModal(true)}
                />
              )}

              {activeTab === 'likes' && (
                <LikesView
                  likedYouProfiles={profiles.filter(p => p.likedYou || p.superLikedYou)}
                  topPicksProfiles={profiles.slice(0, 4)}
                  isGold={userSettings.activeSubscriptionTier !== 'free'}
                  onOpenSubscription={() => setShowSubscriptionModal(true)}
                  onMatchUser={(p) => {
                    handleSwipe(p, 'right');
                    setActiveTab('matches');
                  }}
                  onSuperLikeUser={(p) => handleSwipe(p, 'up')}
                />
              )}

              {activeTab === 'matches' && (
                <MatchesChatView
                  matches={matches}
                  activeMatch={activeMatch}
                  setActiveMatch={setActiveMatch}
                  onSendMessage={handleSendMessage}
                  onReportProfile={handleReportProfile}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  user={currentUser}
                  onUpdateUser={(updated) => setCurrentUser(prev => ({ ...prev, ...updated }))}
                  userSettings={userSettings}
                  onOpenSettings={() => setShowSettingsView(true)}
                  onOpenSubscription={() => setShowSubscriptionModal(true)}
                  onStartVerification={() => setShowVerificationWizard(true)}
                />
              )}

              {activeTab === 'admin' && isAdmin && (
                <AdminDashboard
                  reports={reports}
                  onResolveReport={handleResolveReport}
                  verificationRequests={verificationRequests}
                  onReviewVerification={handleReviewVerification}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation */}
        {!activeMatch && !showSettingsView && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadNotificationsCount={unreadNotificationsCount}
            unreadMessagesCount={unreadMessagesCount}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onOpenFilters={() => setShowFilterModal(true)}
            onOpenSubscription={() => setShowSubscriptionModal(true)}
            isNativeDeviceFrame={userSettings.capacitorNativeMode}
            setIsNativeDeviceFrame={(val) => {
              const next = typeof val === 'function' ? val(userSettings.capacitorNativeMode) : val;
              setUserSettings(prev => ({ ...prev, capacitorNativeMode: next }));
            }}
            isGold={userSettings.activeSubscriptionTier !== 'free'}
            isAdmin={isAdmin}
          />
        )}

        {/* IT'S A MATCH CELEBRATION MODAL */}
        {matchCelebration && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-6 text-white text-center">
            <div className="mt-8 space-y-2 animate-bounce">
              <span className="text-4xl">🎉</span>
              <h2 className="text-4xl font-black bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                It's a Match!
              </h2>
              <p className="text-xs text-gray-300">You and {matchCelebration.name} liked each other</p>
            </div>

            {/* Overlapping Avatars */}
            <div className="relative flex items-center justify-center my-6">
              <img
                src={currentUser.photos[0]}
                alt=""
                className="w-28 h-28 rounded-full object-cover ring-4 ring-rose-500 shadow-2xl transform -translate-x-4"
              />
              <img
                src={matchCelebration.photos[0]}
                alt=""
                className="w-28 h-28 rounded-full object-cover ring-4 ring-pink-500 shadow-2xl transform translate-x-4"
              />
            </div>

            <div className="w-full max-w-xs space-y-3 mb-8">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setMatchCelebration(null);
                  setActiveTab('matches');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-102"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>Send a Message Now</span>
              </button>

              <button
                onClick={() => setMatchCelebration(null)}
                className="w-full py-3 bg-white/10 text-white font-bold rounded-2xl text-xs hover:bg-white/20"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        )}

        {/* MODALS */}
        {showSubscriptionModal && (
          <SubscriptionModal
            currentTier={userSettings.activeSubscriptionTier}
            onUpgradeTier={(tier) => setUserSettings(prev => ({ ...prev, activeSubscriptionTier: tier }))}
            onClose={() => setShowSubscriptionModal(false)}
          />
        )}

        {showFilterModal && (
          <SearchFilterModal
            filters={filters}
            onApplyFilters={(newF) => setFilters(newF)}
            onClose={() => setShowFilterModal(false)}
          />
        )}

        {showNotificationsModal && (
          <NotificationsModal
            notifications={notifications}
            onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
            onClose={() => setShowNotificationsModal(false)}
            onSelectNotification={(item) => {
              setShowNotificationsModal(false);
              if (item.type === 'match' || item.type === 'message') {
                setActiveTab('matches');
              } else if (item.type === 'superlike' || item.type === 'like') {
                setActiveTab('likes');
              }
            }}
          />
        )}

        {showVerificationWizard && (
          <VerificationWizard
            onClose={() => setShowVerificationWizard(false)}
            onVerifiedSuccess={() => setCurrentUser(prev => ({ ...prev, verified: true, verifiedBadge: true }))}
          />
        )}
      </div>
    </DeviceFrame>
  );
}
