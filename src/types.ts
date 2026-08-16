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
    languages?: string[];
    communicationStyle?: string;
    wantChildren?: string;
    childrenCount?: string;
    lookingForGender?: string;
  };
  lookingFor:
    | 'Long-term relationship'
    | 'Relationship'
    | 'Casual dating'
    | 'Friendship'
    | 'Marriage'
    | 'Open to anything'
    | 'Short-term fun'
    | 'New friends'
    | 'Still figuring it out'
    | string;
  spotifyTrack?: {
    title: string;
    artist: string;
    albumCover: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  compatibilityScore: number;
  compatibilityReason?: string;
  likedYou?: boolean;
  superLikedYou?: boolean;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ReplyReference {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  mediaType?: 'image' | 'audio' | 'video' | 'file' | 'date_invite';
  mediaUrl?: string;
}

export interface DateInviteData {
  title: string;
  vibe: string;
  location: string;
  activity: string;
  status: 'pending' | 'accepted' | 'declined';
  proposedBy?: string;
}

export interface CallEventData {
  type: 'voice' | 'video';
  direction?: 'incoming' | 'outgoing' | 'missed';
  durationSeconds?: number;
  status: 'completed' | 'missed' | 'declined' | 'cancelled';
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string; // 'user_me' or match user id
  senderName?: string;
  text: string;
  timestamp: string;
  createdAt?: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isEdited?: boolean;
  editedAt?: string;
  editTimestamp?: string;
  deletedForMe?: boolean;
  deletedForEveryone?: boolean;
  isImage?: boolean;
  imageUrl?: string;
  imageCaption?: string;
  isAudio?: boolean;
  audioUrl?: string;
  audioDuration?: string;
  audioWaveform?: number[];
  isVideo?: boolean;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDuration?: string;
  isFile?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileMimeType?: string;
  isGif?: boolean;
  gifUrl?: string;
  isDateInvite?: boolean;
  dateInvite?: DateInviteData;
  isCallEvent?: boolean;
  callEvent?: CallEventData;
  replyTo?: ReplyReference;
  reactions?: MessageReaction[];
  pinned?: boolean;
  starred?: boolean;
  urlPreview?: {
    url: string;
    title: string;
    description: string;
    image?: string;
    domain: string;
  };
}

export interface Match {
  id: string;
  user: UserProfile;
  matchedAt: string;
  lastMessage?: Message | string;
  lastMessageTime?: string;
  unreadCount: number;
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeen?: string;
  isTyping?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isBlocked?: boolean;
  draftText?: string;
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
  // Location
  locationName: string;
  locationCoords: { lat: number; lng: number };
  locationOnlyMode: boolean; // Only show people within my selected area
  maxDistanceKm: number; // 1 to 500 km
  
  // Demographics
  ageRange: [number, number]; // 18 - 80
  genderPreference: 'everyone' | 'women' | 'men' | 'nonbinary';
  
  // Looking For (relationship intent)
  lookingForFilter: string | string[]; // Relationships, Casual dating, Friendship, etc.
  
  // Shared Interests
  selectedPassions: string[];
  prioritizeCommonInterests: boolean;
  
  // Quality & Verification Filters
  verifiedOnly: boolean;
  hasPhotosOnly: boolean;
  
  // Lifestyle filters
  lifestyleFilters?: {
    drinking?: string;
    smoking?: string;
    wantChildren?: string;
  };
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
