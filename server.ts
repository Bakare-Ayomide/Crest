import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini AI SDK lazily on request or if API key exists
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "CREST Backend", time: new Date().toISOString() });
  });

  // User preferences in-memory state
  let userPreferencesStore = {
    locationName: "San Francisco, CA",
    locationCoords: { lat: 37.7749, lng: -122.4194 },
    locationOnlyMode: true,
    maxDistanceKm: 25,
    ageRange: [21, 35],
    genderPreference: "everyone",
    lookingForFilter: ["Long-term relationship"],
    selectedPassions: ["Specialty Coffee", "Indie Music", "Photography", "Hiking"],
    prioritizeCommonInterests: true,
    verifiedOnly: false,
    hasPhotosOnly: true,
    lifestyleFilters: {
      drinking: "all",
      smoking: "never",
      wantChildren: "all"
    },
    updatedAt: new Date().toISOString()
  };

  // Get user preferences
  app.get("/api/user/preferences", (req, res) => {
    res.json({ success: true, preferences: userPreferencesStore });
  });

  // Save / update user preferences (debounced from client)
  app.post("/api/user/preferences", (req, res) => {
    const updates = req.body || {};
    userPreferencesStore = {
      ...userPreferencesStore,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    res.json({ success: true, preferences: userPreferencesStore, message: "Preferences synchronized." });
  });

  // AI Bio Assistant endpoint
  app.post("/api/ai/bio", async (req, res) => {
    const { currentBio, interests, tone } = req.body || {};
    try {
      const ai = getGenAI();
      
      if (!ai) {
        return res.json({
          bios: [
            currentBio
              ? `${currentBio} ✨ Seeking genuine connections, spontaneous road trips, and coffee tasting.`
              : `Coffee enthusiast & sunset collector ☕🌅. Lover of ${interests?.slice(0, 3)?.join(", ") || "travel, music and food"}.`,
            `Espresso enthusiast by day, amateur chef by night ☕🍝. Always up for live indie gigs and spontaneous road trips!`,
            `Searching for someone who can beat me at board games and appreciate a perfect avocado toast 🥑.`
          ]
        });
      }

      const prompt = `You are a friendly, charismatic dating profile bio writer.
User interests: ${interests ? interests.join(", ") : "music, travel, culinary, photography"}.
Current draft: "${currentBio || "None provided"}".
Tone preferred: ${tone || "playful, warm and intriguing"}.
Write 3 bullet-proof engaging dating bio options (short, under 280 characters each). Format as JSON array of strings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "[]";
      let bios = [];
      try {
        bios = JSON.parse(text);
      } catch (e) {
        bios = [text];
      }

      return res.json({ bios: Array.isArray(bios) && bios.length > 0 ? bios : [text] });
    } catch (err: any) {
      // Provide seamless fallback bio options if API call fails
      return res.json({
        bios: [
          currentBio
            ? `${currentBio} ✨ Seeking genuine connections, spontaneous road trips, and coffee tasting.`
            : `Coffee enthusiast & sunset collector ☕🌅. Lover of ${interests?.slice(0, 3)?.join(", ") || "travel, music and food"}.`,
          `Espresso enthusiast by day, amateur chef by night ☕🍝. Always up for live indie gigs!`,
          `Searching for someone who can beat me at board games and appreciate a perfect avocado toast 🥑.`
        ]
      });
    }
  });

  // AI Icebreaker / Wingman endpoint
  app.post("/api/ai/icebreaker", async (req, res) => {
    const { matchName, matchInterests, bio } = req.body || {};
    const name = matchName || "there";
    const primaryInterest = matchInterests?.[0] || "your interests";

    try {
      const ai = getGenAI();

      if (!ai) {
        return res.json({
          starters: [
            `Hey ${name}! I noticed you like ${primaryInterest}. What's your absolute favorite spot you've been to? 🌟`,
            `On a scale of 1 to 10, how adventurous are you feeling this weekend, ${name}? ☕`,
            `Quick debate ${name}: Best coffee order ever? Go!`
          ]
        });
      }

      const prompt = `You are an expert dating wingman. Create 3 witty, charming, and non-creepy conversation openers for messaging a match named ${name}.
Match's Interests: ${matchInterests?.join(", ") || "General"}.
Match's Bio: "${bio || ""}".
Return a JSON array of 3 starter strings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "[]";
      let starters = [];
      try {
        starters = JSON.parse(text);
      } catch (e) {
        starters = [text];
      }

      return res.json({ starters: Array.isArray(starters) && starters.length > 0 ? starters : [text] });
    } catch (err: any) {
      // Provide seamless fallback starters if API call fails
      return res.json({
        starters: [
          `Hey ${name}! I noticed you're into ${primaryInterest}. What got you started with that? 🌟`,
          `On a scale of 1 to 10, how adventurous are you feeling this week, ${name}? ☕`,
          `Quick debate for you ${name}: Best first-date spot - cozy coffee shop or lively rooftop bar?`
        ]
      });
    }
  });

  // AI Date Spot recommendation
  app.post("/api/ai/datespot", async (req, res) => {
    const { city, vibe } = req.body || {};
    const location = city || "San Francisco";

    try {
      const ai = getGenAI();

      if (!ai) {
        return res.json({
          suggestions: [
            { name: `Cozy Rooftop Bar in ${location}`, vibe: "Romantic & Ambient", activity: "Cocktails & Sunset view" },
            { name: "Artisanal Gelato & Park Stroll", vibe: "Casual & Fun", activity: "Sweet treats & Conversation" },
            { name: "Indie Board Game Cafe", vibe: "Playful & Cozy", activity: "Co-op games & Lattes" }
          ]
        });
      }

      const prompt = `Suggest 3 unique first date ideas for ${location} with a ${vibe || "relaxed, chic"} vibe. Return as JSON array of objects with fields: "name", "vibe", "activity".`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const text = response.text || "[]";
      let suggestions = [];
      try {
        suggestions = JSON.parse(text);
      } catch (e) {
        suggestions = [];
      }

      return res.json({ suggestions: Array.isArray(suggestions) && suggestions.length > 0 ? suggestions : [] });
    } catch (err: any) {
      // Provide seamless fallback date spot suggestions if API call fails
      return res.json({
        suggestions: [
          { name: `Cozy Rooftop Botanical Bar`, vibe: "Romantic & Ambient", activity: "Cocktails & Sunset view" },
          { name: `Artisanal Gelato & Stroll in ${location}`, vibe: "Casual & Fun", activity: "Sweet treats & Walk" },
          { name: `Speakeasy Cocktail Lounge`, vibe: "Chic & Intimate", activity: "Craft drinks & live jazz" }
        ]
      });
    }
  });

  // In-memory message store initialized per match
  const messagesStore: Record<string, any[]> = {
    match_1: [
      {
        id: 'msg_init_1',
        matchId: 'match_1',
        senderId: 'prof_1',
        text: 'Hey Alex! I saw on your profile that you love road trips and indie gigs. Have you been to any concerts recently? 🎸',
        timestamp: '10:14 AM',
        createdAt: Date.now() - 3600000 * 3,
        status: 'read'
      },
      {
        id: 'msg_init_2',
        matchId: 'match_1',
        senderId: 'user_me',
        text: 'Hey Victoria! Yes, just saw The Sunset Club live last month in Brooklyn! Their stage visuals were insane.',
        timestamp: '10:28 AM',
        createdAt: Date.now() - 3600000 * 2,
        status: 'read'
      },
      {
        id: 'msg_init_3',
        matchId: 'match_1',
        senderId: 'prof_1',
        text: 'I love them! "Deadtide" is literally on repeat on my Spotify right now ✨',
        timestamp: '10:42 AM',
        createdAt: Date.now() - 3600000,
        status: 'read',
        reactions: [{ emoji: '❤️', userIds: ['user_me'] }]
      }
    ],
    match_2: [
      {
        id: 'msg_m2_1',
        matchId: 'match_2',
        senderId: 'prof_5',
        text: 'Hey Alex! Thanks for the super like 🌊. Loved your prompt about visiting Tokyo!',
        timestamp: 'Yesterday 6:30 PM',
        createdAt: Date.now() - 86400000,
        status: 'read'
      },
      {
        id: 'msg_m2_2',
        matchId: 'match_2',
        senderId: 'user_me',
        text: 'Diving with humpback whales sounds unbelievable! Must have been surreal.',
        timestamp: 'Yesterday 8:15 PM',
        createdAt: Date.now() - 86400000 + 3600000,
        status: 'read'
      }
    ],
    match_3: [
      {
        id: 'msg_m3_1',
        matchId: 'match_3',
        senderId: 'prof_3',
        text: 'Let us definitely grab tacos at La Taqueria this Friday! 🌮',
        timestamp: 'Aug 8',
        createdAt: Date.now() - 86400000 * 3,
        status: 'read'
      }
    ]
  };

  const blockedUsers = new Set<string>();
  const reportedTickets: any[] = [];

  // Get messages for a match
  app.get("/api/chat/:matchId/messages", (req, res) => {
    const { matchId } = req.params;
    const list = messagesStore[matchId] || [];
    res.json({ messages: list });
  });

  // Send message to a match
  app.post("/api/chat/:matchId/messages", async (req, res) => {
    const { matchId } = req.params;
    const message = req.body;

    if (!message || (!message.text && !message.imageUrl && !message.audioUrl && !message.videoUrl && !message.fileUrl && !message.isDateInvite)) {
      return res.status(400).json({ error: "Empty message payload" });
    }

    if (!messagesStore[matchId]) {
      messagesStore[matchId] = [];
    }

    const newMsg = {
      ...message,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId,
      createdAt: message.createdAt || Date.now(),
      timestamp: message.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "delivered",
    };

    messagesStore[matchId].push(newMsg);

    res.json({ message: newMsg });
  });

  // Update message (reactions, edits, read status, pin)
  app.patch("/api/chat/:matchId/messages/:messageId", (req, res) => {
    const { matchId, messageId } = req.params;
    const updates = req.body;

    if (!messagesStore[matchId]) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const index = messagesStore[matchId].findIndex((m) => m.id === messageId);
    if (index === -1) {
      return res.status(404).json({ error: "Message not found" });
    }

    messagesStore[matchId][index] = {
      ...messagesStore[matchId][index],
      ...updates,
    };

    res.json({ message: messagesStore[matchId][index] });
  });

  // Delete message
  app.delete("/api/chat/:matchId/messages/:messageId", (req, res) => {
    const { matchId, messageId } = req.params;
    const { deleteForEveryone } = req.query;

    if (!messagesStore[matchId]) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const index = messagesStore[matchId].findIndex((m) => m.id === messageId);
    if (index === -1) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (deleteForEveryone === "true") {
      messagesStore[matchId][index] = {
        ...messagesStore[matchId][index],
        text: "🚫 This message was deleted",
        isImage: false,
        imageUrl: undefined,
        isAudio: false,
        audioUrl: undefined,
        isVideo: false,
        videoUrl: undefined,
        deletedForEveryone: true,
      };
    } else {
      messagesStore[matchId][index] = {
        ...messagesStore[matchId][index],
        deletedForMe: true,
      };
    }

    res.json({ success: true, message: messagesStore[matchId][index] });
  });

  // Media upload endpoint with validation
  app.post("/api/chat/upload", (req, res) => {
    const { dataUrl, fileName, mimeType, size } = req.body;

    if (!dataUrl) {
      return res.status(400).json({ error: "Missing data payload" });
    }

    // Validate size limit (max 50MB)
    if (size && size > 50 * 1024 * 1024) {
      return res.status(413).json({ error: "File exceeds 50MB limit" });
    }

    // In a production server we'd store in Google Cloud Storage / S3 / Firestore bucket.
    // For fast in-app experience, returning optimized base64 data URL
    res.json({
      url: dataUrl,
      fileName: fileName || "attachment",
      mimeType: mimeType || "application/octet-stream",
      size: size || 0,
    });
  });

  // URL preview extractor
  app.post("/api/chat/url-preview", (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace("www.", "");
      
      let title = `Link on ${domain}`;
      let description = `Explore content from ${domain}`;
      let image = "";

      if (url.includes("spotify.com")) {
        title = "Spotify Music & Playlists";
        description = "Listen to curated tracks and top songs on Spotify.";
        image = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=600&q=80";
      } else if (url.includes("instagram.com")) {
        title = "Instagram Profile / Post";
        description = "View photos, reels, and stories on Instagram.";
        image = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80";
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        title = "YouTube Video";
        description = "Watch high-definition videos and music streams on YouTube.";
        image = "https://images.unsplash.com/photo-1611162616475-46b635cb6868?auto=format&fit=crop&w=600&q=80";
      } else if (url.includes("yelp.com") || url.includes("opentable.com")) {
        title = "Restaurant & Cocktail Lounge";
        description = "Reserve a table, see menus, and read reviews.";
        image = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";
      }

      res.json({
        url,
        title,
        description,
        image,
        domain,
      });
    } catch (e) {
      res.status(400).json({ error: "Invalid URL" });
    }
  });

  // Block & Report safety endpoints
  app.post("/api/chat/block", (req, res) => {
    const { userId, matchId } = req.body;
    if (userId) blockedUsers.add(userId);
    res.json({ success: true, message: `User ${userId} has been blocked.` });
  });

  app.post("/api/chat/report", (req, res) => {
    const { userId, userName, reason, details, reporterId } = req.body;
    const ticket = {
      id: `rep_${Date.now()}`,
      reportedUserId: userId,
      reportedUserName: userName || "Reported User",
      reporterName: reporterId || "User",
      reason: reason || "Inappropriate behavior",
      details: details || "",
      timestamp: new Date().toISOString(),
      status: "open",
    };
    reportedTickets.push(ticket);
    res.json({ success: true, ticket });
  });

  // Vite middleware for dev or Static serve for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CREST server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
