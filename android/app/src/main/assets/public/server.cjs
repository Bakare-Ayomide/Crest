var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "10mb" }));
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "CREST Backend", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/ai/bio", async (req, res) => {
    const { currentBio, interests, tone } = req.body || {};
    try {
      const ai = getGenAI();
      if (!ai) {
        return res.json({
          bios: [
            currentBio ? `${currentBio} \u2728 Seeking genuine connections, spontaneous road trips, and coffee tasting.` : `Coffee enthusiast & sunset collector \u2615\u{1F305}. Lover of ${interests?.slice(0, 3)?.join(", ") || "travel, music and food"}.`,
            `Espresso enthusiast by day, amateur chef by night \u2615\u{1F35D}. Always up for live indie gigs and spontaneous road trips!`,
            `Searching for someone who can beat me at board games and appreciate a perfect avocado toast \u{1F951}.`
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
          responseMimeType: "application/json"
        }
      });
      const text = response.text || "[]";
      let bios = [];
      try {
        bios = JSON.parse(text);
      } catch (e) {
        bios = [text];
      }
      return res.json({ bios: Array.isArray(bios) && bios.length > 0 ? bios : [text] });
    } catch (err) {
      return res.json({
        bios: [
          currentBio ? `${currentBio} \u2728 Seeking genuine connections, spontaneous road trips, and coffee tasting.` : `Coffee enthusiast & sunset collector \u2615\u{1F305}. Lover of ${interests?.slice(0, 3)?.join(", ") || "travel, music and food"}.`,
          `Espresso enthusiast by day, amateur chef by night \u2615\u{1F35D}. Always up for live indie gigs!`,
          `Searching for someone who can beat me at board games and appreciate a perfect avocado toast \u{1F951}.`
        ]
      });
    }
  });
  app.post("/api/ai/icebreaker", async (req, res) => {
    const { matchName, matchInterests, bio } = req.body || {};
    const name = matchName || "there";
    const primaryInterest = matchInterests?.[0] || "your interests";
    try {
      const ai = getGenAI();
      if (!ai) {
        return res.json({
          starters: [
            `Hey ${name}! I noticed you like ${primaryInterest}. What's your absolute favorite spot you've been to? \u{1F31F}`,
            `On a scale of 1 to 10, how adventurous are you feeling this weekend, ${name}? \u2615`,
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
          responseMimeType: "application/json"
        }
      });
      const text = response.text || "[]";
      let starters = [];
      try {
        starters = JSON.parse(text);
      } catch (e) {
        starters = [text];
      }
      return res.json({ starters: Array.isArray(starters) && starters.length > 0 ? starters : [text] });
    } catch (err) {
      return res.json({
        starters: [
          `Hey ${name}! I noticed you're into ${primaryInterest}. What got you started with that? \u{1F31F}`,
          `On a scale of 1 to 10, how adventurous are you feeling this week, ${name}? \u2615`,
          `Quick debate for you ${name}: Best first-date spot - cozy coffee shop or lively rooftop bar?`
        ]
      });
    }
  });
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
        config: { responseMimeType: "application/json" }
      });
      const text = response.text || "[]";
      let suggestions = [];
      try {
        suggestions = JSON.parse(text);
      } catch (e) {
        suggestions = [];
      }
      return res.json({ suggestions: Array.isArray(suggestions) && suggestions.length > 0 ? suggestions : [] });
    } catch (err) {
      return res.json({
        suggestions: [
          { name: `Cozy Rooftop Botanical Bar`, vibe: "Romantic & Ambient", activity: "Cocktails & Sunset view" },
          { name: `Artisanal Gelato & Stroll in ${location}`, vibe: "Casual & Fun", activity: "Sweet treats & Walk" },
          { name: `Speakeasy Cocktail Lounge`, vibe: "Chic & Intimate", activity: "Craft drinks & live jazz" }
        ]
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CREST server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
