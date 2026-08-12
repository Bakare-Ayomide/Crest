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
