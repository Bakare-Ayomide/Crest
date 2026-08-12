import { UserProfile, Match, NotificationItem, ReportTicket, VerificationRequest } from '../types';
import victoriaGlam from '../assets/images/victoria_glam_photo_1786497071920.jpg';
import victoriaResortBikini from '../assets/images/victoria_resort_bikini_1786497090420.jpg';
import victoriaTealDress from '../assets/images/victoria_teal_dress_1786497108851.jpg';
import victoriaClubGlam from '../assets/images/victoria_club_glam_1786497124209.jpg';
import shindaraArtPortrait from '../assets/images/shindara_art_portrait_1786497218180.jpg';
import pehLumieResort from '../assets/images/peh_lumie_resort_1786497240476.jpg';

export const CURRENT_USER: UserProfile = {
  id: 'user_me',
  name: 'Alex Morgan',
  age: 26,
  gender: 'male',
  distanceKm: 0,
  bio: 'Software engineer & weekend trail runner 🏃‍♂️. Always searching for the best espresso in town and someone who can beat me at Catan. Big fan of live indie gigs & outdoor photography.',
  photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
  ],
  verified: true,
  verifiedBadge: true,
  interests: ['Indie Music', 'Specialty Coffee', 'Hiking', 'Photography', 'Board Games', 'Cookouts'],
  prompts: [
    {
      id: 'p1',
      question: 'The key to my heart is...',
      answer: 'Surprising me with fresh cardamom buns and a spontaneous road trip playlist.'
    },
    {
      id: 'p2',
      question: 'Two truths and a lie...',
      answer: '1. I ran a half marathon in Tokyo. 2. I accidentally met Keanu Reeves at a bakery. 3. I speak 4 languages.'
    }
  ],
  jobTitle: 'Senior Product Engineer',
  company: 'Tech Studio',
  education: 'UC Berkeley',
  locationName: 'San Francisco, CA',
  height: '6\'1" (185 cm)',
  zodiac: 'Scorpio ♏',
  lifestyle: {
    pets: 'Dog lover 🐶',
    drinking: 'Socially 🍸',
    workout: 'Often 💪',
    smoking: 'Never 🚭'
  },
  lookingFor: 'Long-term relationship',
  spotifyTrack: {
    title: 'Deadtide',
    artist: 'The Sunset Club',
    albumCover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80'
  },
  compatibilityScore: 100
};

export const MOCK_PROFILES: UserProfile[] = [
  {
    id: 'prof_1',
    name: 'VICTORIA',
    age: 26,
    gender: 'female',
    distanceKm: 2,
    bio: 'Fashion designer & sunset enthusiast ✨. Passionate about art galleries, tropical resort travel 🌴, and curated playlists.',
    photos: [
      victoriaGlam,
      victoriaResortBikini,
      victoriaTealDress,
      victoriaClubGlam
    ],
    verified: true,
    verifiedBadge: true,
    interests: ['Fashion', 'Art Galleries', 'Tropical Travel', 'Cocktails', 'Rooftops', 'Vinyl Records'],
    prompts: [
      {
        id: 'sp1',
        question: 'My ideal Sunday looks like...',
        answer: 'Golden hour drinks at a beach resort, followed by spontaneous dinner reservations.'
      },
      {
        id: 'sp2',
        question: 'Together, we could...',
        answer: 'Travel to warm spring resorts and discover hidden art museums.'
      }
    ],
    jobTitle: 'Creative Director',
    company: 'Maison Luxe',
    education: 'Parsons School of Design',
    locationName: 'USA, NEW YORK',
    height: '5\'8"',
    zodiac: 'Leo ♌',
    lifestyle: {
      pets: 'Dog lover 🐶',
      drinking: 'Socially 🍸',
      workout: 'Pilates & Swimming 🧘‍♀️',
      smoking: 'Never 🚭',
      languages: ['English 🇬🇧', 'French 🇫🇷', 'Yoruba 🇳🇬'],
      communicationStyle: 'Big texter 💬',
      wantChildren: 'Want children 👶',
      childrenCount: 'None',
      lookingForGender: 'Men 👨'
    },
    lookingFor: 'Long-term relationship',
    spotifyTrack: {
      title: 'Golden Hour',
      artist: 'Kacey Musgraves',
      albumCover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80'
    },
    compatibilityScore: 98,
    compatibilityReason: 'Shared passion for fashion, art, and travel.',
    likedYou: true
  },
  {
    id: 'prof_2',
    name: 'Marcus Vance',
    age: 28,
    gender: 'male',
    distanceKm: 5,
    bio: 'Chef & restaurant owner 🍳. Obsessed with natural wines, ramen pop-ups, and coastal surfing trips. Teach me something I don’t know!',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80'
    ],
    verified: true,
    verifiedBadge: true,
    interests: ['Culinary', 'Surfing', 'Natural Wine', 'Live Jazz', 'Camping'],
    prompts: [
      {
        id: 'mp1',
        question: 'I promise to always cook you...',
        answer: 'Late-night truffle pasta when you’ve had a long week.'
      }
    ],
    jobTitle: 'Executive Chef',
    company: 'Nectar Bistro',
    education: 'CIA Culinary',
    locationName: 'Mission District, SF',
    height: '6\'0"',
    zodiac: 'Leo ♌',
    lifestyle: {
      pets: 'Dog & Cat 🐶🐱',
      drinking: 'Wine lover 🍷',
      workout: 'Surfing & Gym 🏄‍♂️'
    },
    lookingFor: 'Long-term relationship',
    compatibilityScore: 88,
    superLikedYou: true
  },
  {
    id: 'prof_3',
    name: 'SHINDARA',
    age: 24,
    gender: 'female',
    distanceKm: 2,
    bio: 'Art director & minimalist ✨. Always seeking vibrant modern art exhibitions, cozy brunch spots, and sunset roadtrips.',
    photos: [
      shindaraArtPortrait,
      victoriaTealDress,
      victoriaClubGlam
    ],
    verified: true,
    verifiedBadge: true,
    interests: ['Modern Art', 'Fashion', 'Brunch', 'Aesthetic Interiors', 'Photography'],
    prompts: [
      {
        id: 'myp1',
        question: 'Dating me is like...',
        answer: 'Unlocking a private art gallery tour with endless coffee tasting.'
      }
    ],
    jobTitle: 'Art Director',
    company: 'Vogue Creative',
    education: 'NYU Tisch',
    locationName: 'SoHo, New York',
    height: '5\'7"',
    zodiac: 'Gemini ♊',
    lifestyle: {
      pets: 'Cat person 🐱',
      workout: 'Pilates & Yoga 🧘‍♀️',
      drinking: 'Socially 🍹',
      smoking: 'Never 🚭',
      languages: ['English 🇬🇧', 'Yoruba 🇳🇬'],
      communicationStyle: 'In-person calls 📞',
      wantChildren: 'Open to children 👶',
      childrenCount: 'None',
      lookingForGender: 'Men 👨'
    },
    lookingFor: 'Long-term relationship',
    compatibilityScore: 94,
    likedYou: true
  },
  {
    id: 'prof_4',
    name: 'PEH LUMIE',
    age: 25,
    gender: 'female',
    distanceKm: 5,
    bio: 'Resort fashion icon & nature lover 🌴. Passionate about warm spring getaways, tropical nature trails, and chic evening dinners.',
    photos: [
      pehLumieResort,
      victoriaResortBikini,
      victoriaGlam
    ],
    verified: true,
    verifiedBadge: true,
    interests: ['Resorts', 'Nature', 'Haute Couture', 'Travel', 'Fine Dining'],
    prompts: [
      {
        id: 'ep1',
        question: 'First round is on me if...',
        answer: 'You know the best tropical resort spot in Ikogosi!'
      }
    ],
    jobTitle: 'Luxury Brand Ambassador',
    company: 'Resort Life',
    education: 'Columbia University',
    locationName: 'Manhattan, New York',
    height: '5\'9"',
    zodiac: 'Sagittarius ♐',
    lifestyle: {
      pets: 'Love dogs 🐶',
      drinking: 'Socially 🍷',
      smoking: 'Never 🚭',
      workout: 'Outdoor Trails & Swimming 🏊‍♀️',
      languages: ['English 🇬🇧', 'Spanish 🇪🇸', 'Yoruba 🇳🇬'],
      communicationStyle: 'Video calls & texts 💬',
      wantChildren: 'Want children 👶',
      childrenCount: 'None',
      lookingForGender: 'Men 👨'
    },
    lookingFor: 'Long-term relationship',
    compatibilityScore: 92,
    likedYou: true
  },
  {
    id: 'prof_5',
    name: 'Chloe Bennett',
    age: 26,
    gender: 'female',
    distanceKm: 4,
    bio: 'Marine biologist studying kelp forests 🐋. Big outdoors energy, acoustic guitar player, and maker of the world’s best cinnamon rolls.',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80'
    ],
    verified: true,
    verifiedBadge: true,
    interests: ['Marine Life', 'Scuba Diving', 'Acoustic Guitar', 'Baking', 'Environmentalism'],
    prompts: [
      {
        id: 'cp1',
        question: 'Fun fact about me...',
        answer: 'I once dived with humpback whales off the coast of Hawaii!'
      }
    ],
    jobTitle: 'Research Scientist',
    company: 'Monterey Bay Aquarium',
    education: 'UC Santa Cruz',
    locationName: 'Sunset, SF',
    height: '5\'6"',
    zodiac: 'Pisces ♓',
    lifestyle: {
      pets: 'Golden Retriever owner 🐕',
      drinking: 'Occasionally 🥂'
    },
    lookingFor: 'Long-term relationship',
    compatibilityScore: 96,
    compatibilityReason: '96% Match! Shared passion for nature, coffee and music.',
    superLikedYou: true
  }
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'match_1',
    user: MOCK_PROFILES[0], // Sophia
    matchedAt: '2 hours ago',
    unreadCount: 1,
    onlineStatus: 'online',
    lastMessage: {
      id: 'm1',
      matchId: 'match_1',
      senderId: 'prof_1',
      text: 'I loved your prompt answer about roadtrip playlists! Have you heard the new Beach House album?',
      timestamp: '10:42 AM',
      status: 'read'
    }
  },
  {
    id: 'match_2',
    user: MOCK_PROFILES[4], // Chloe
    matchedAt: 'Yesterday',
    unreadCount: 0,
    onlineStatus: 'online',
    lastMessage: {
      id: 'm2',
      matchId: 'match_2',
      senderId: 'user_me',
      text: 'Diving with humpback whales sounds unbelievable! Must have been surreal.',
      timestamp: 'Yesterday 8:15 PM',
      status: 'read'
    }
  },
  {
    id: 'match_3',
    user: MOCK_PROFILES[2], // Maya
    matchedAt: '3 days ago',
    unreadCount: 0,
    onlineStatus: 'away',
    lastMessage: {
      id: 'm3',
      matchId: 'match_3',
      senderId: 'prof_3',
      text: 'Let us definitely grab tacos at La Taqueria this Friday! 🌮',
      timestamp: 'Aug 8',
      status: 'read'
    }
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'match',
    title: 'New Match!',
    message: 'You and Sophia Chen matched! Say hello before someone else does.',
    timestamp: '2h ago',
    read: false,
    userAvatar: MOCK_PROFILES[0].photos[0],
    profileId: 'prof_1'
  },
  {
    id: 'n2',
    type: 'superlike',
    title: 'Super Like Received!',
    message: 'Chloe super liked your profile with a special note!',
    timestamp: '5h ago',
    read: false,
    userAvatar: MOCK_PROFILES[4].photos[0],
    profileId: 'prof_5'
  },
  {
    id: 'n3',
    type: 'like',
    title: 'Someone liked you!',
    message: 'Elena and 3 others liked your profile. Reveal them with CREST Gold.',
    timestamp: '1d ago',
    read: true,
    userAvatar: MOCK_PROFILES[3].photos[0]
  },
  {
    id: 'n4',
    type: 'verification',
    title: 'Profile Verified',
    message: 'Congratulations! Your photo verification pose was approved. Your profile now features the Blue Badge.',
    timestamp: '2d ago',
    read: true
  }
];

export const MOCK_REPORTS: ReportTicket[] = [
  {
    id: 'rep_101',
    reportedUserId: 'prof_bad_1',
    reportedUserName: 'Fake Account (SpamBot)',
    reportedUserPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    reporterName: 'David K.',
    reason: 'Inappropriate commercial spam link in messages',
    details: 'User sent third-party crypto phishing links immediately after matching.',
    timestamp: '2026-08-11 11:30',
    status: 'open'
  },
  {
    id: 'rep_102',
    reportedUserId: 'prof_bad_2',
    reportedUserName: 'Unresponsive Ghost',
    reportedUserPhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
    reporterName: 'Sarah M.',
    reason: 'Fake photo / Impersonation',
    details: 'Photos appear to be stolen stock photography without verification.',
    timestamp: '2026-08-11 09:15',
    status: 'open'
  }
];

export const MOCK_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'ver_201',
    userId: 'prof_new_1',
    userName: 'Jessica Miller',
    userPhoto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    capturedSelfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    requiredGesture: 'Peace Sign ✌️',
    timestamp: '10 mins ago',
    status: 'pending'
  }
];
