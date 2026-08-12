export interface PromptAnswer {
  id: string;
  question: string;
  answer: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'nonbinary' | 'other';
  distanceKm: number;
  bio: string;
  photos: string[];
  verified: boolean;
  verifiedBadge?: boolean;
  interests: string[];
  prompts: PromptAnswer[];
  jobTitle?: string;
  company?: string;
  education?: string;
  locationName: string;
  height?: string;
  zodiac?: string;
  lifestyle?: {
    pets?: string;
    drinking?: string;
    smoking?: string;
    workout?: string;
    diet?: string;
  };
  lookingFor: 'Long-term relationship' | 'Short-term fun' | 'New friends' | 'Still figuring it out';
  spotifyTrack?: {
    title: string;
    artist: string;
    albumCover: string;
  };
  compatibilityScore: number;
  compatibilityReason?: string;
  likedYou?: boolean;
  superLikedYou?: boolean;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface Message {
  id: string;
  matchId: string;
  senderId: string; // 'user' or match user id
  text: string;
  timestamp: string;
  isImage?: boolean;
  imageUrl?: string;
  isAudio?: boolean;
  audioDuration?: string;
  isGif?: boolean;
  gifUrl?: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Match {
  id: string;
  user: UserProfile;
  matchedAt: string;
  lastMessage?: Message;
  unreadCount: number;
  onlineStatus: 'online' | 'offline' | 'away';
}

export interface NotificationItem {
  id: string;
  type: 'match' | 'superlike' | 'like' | 'message' | 'verification' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userAvatar?: string;
  profileId?: string;
}

export interface FilterSettings {
  ageRange: [number, number];
  maxDistanceKm: number;
  genderPreference: 'everyone' | 'women' | 'men' | 'nonbinary';
  verifiedOnly: boolean;
  hasPhotosOnly: boolean;
  lookingForFilter: string;
  selectedPassions: string[];
}

export interface UserSettings {
  darkTheme: boolean;
  distanceUnit: 'km' | 'mi';
  globalMode: boolean;
  showMeOnCrest: boolean;
  incognitoMode: boolean;
  pushNotifications: boolean;
  matchAlerts: boolean;
  messageAlerts: boolean;
  capacitorNativeMode: boolean;
  activeSubscriptionTier: 'free' | 'plus' | 'gold' | 'platinum';
  boostsRemaining: number;
  superLikesRemaining: number;
}

export type VerificationStep = 'intro' | 'camera' | 'review' | 'submitted';

export interface ReportTicket {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserPhoto: string;
  reporterName: string;
  reason: string;
  details?: string;
  timestamp: string;
  status: 'open' | 'resolved' | 'banned';
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  capturedSelfieUrl: string;
  requiredGesture: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}
