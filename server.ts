import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Indicator
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route for calling Gemini to generate custom terrain parameters
  app.post("/api/generate_seed", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: "Creative prompt is required" });
        return;
      }
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY environment secret is not configured in Settings." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `You are an expert MineCraft procedural voxel world terrain designer.
Based on the user's prompt, generate custom terrain generation parameters in JSON format.
Choose appropriate block numbers and configurations matching the requested biome idea.
Return ONLY valid JSON matching the schema. Do not include markdown codeblocks or comments.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate custom Limecraft voxel world parameters for prompt: "${prompt.trim()}"`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              worldName: {
                type: Type.STRING,
                description: "Short creative theme name, e.g. 'Golden Glitch Meadows'",
              },
              seedString: {
                type: Type.STRING,
                description: "Slug-like seed name, e.g. 'golden_glitch_8827'",
              },
              seedType: {
                type: Type.INTEGER,
                description: "The base blueprint model: 1 (rolling grass hills), 2 (neighborhood cottage areas), 3 (flat plain), 4 (village pathways), 5 (summited pyramids), or 842 (floating islands!). Choose the most suitable base geometry.",
              },
              spawnBlock: {
                type: Type.INTEGER,
                description: "Top surface block ID: GRASS=1, WOOD=2, STONE=3, COBBLESTONE=4, MOSSY_COBBLE=5, LEAVES=6, BRICK=8, DIAMOND=12, BIRCH=14, BED=15, DIRT_PATH=16, RUOTK=17, WATER=18, GOLD_BLOCK=20",
              },
              foundationBlock: {
                type: Type.INTEGER,
                description: "Sub-surface blocks ID: STONE=3, COBBLESTONE=4, MOSSY_COBBLE=5, BRICK=8, RUOTK=17, BIRCH=14, WOOD=2, GOLD_BLOCK=20",
              },
              amplitude: {
                type: Type.NUMBER,
                description: "Height variation scale, from 1.0 (very gentle slopes) to 18.0 (extreme sky-scraping canyons).",
              },
              baseHeight: {
                type: Type.INTEGER,
                description: "Minimum baseline surface altitude (range of 3 to 15, default is 6).",
              },
              treeDensity: {
                type: Type.NUMBER,
                description: "Probability of tree sprouts on grass, from 0.00 to 0.15 maximum.",
              },
              treeType: {
                type: Type.INTEGER,
                description: "Tree trunk block ID: WOOD=2, BIRCH=14, BRICK=8, RUOTK=17, STONE=3, GOLD_BLOCK=20",
              },
              leafType: {
                type: Type.INTEGER,
                description: "Tree leaf block ID: LEAVES=6, DIAMOND=12, WATER=18, GOLD_BLOCK=20, AIR=0 (no leaves)",
              },
              hasPonds: {
                type: Type.BOOLEAN,
                description: "True if water pools carve out from the ground.",
              },
              customDescription: {
                type: Type.STRING,
                description: "A friendly, descriptive sentence telling the player how their prompt was translated into custom voxel structures.",
              }
            },
            required: ["worldName", "seedString", "seedType", "spawnBlock", "foundationBlock", "amplitude", "baseHeight", "treeDensity", "treeType", "leafType", "hasPonds", "customDescription"]
          }
        }
      });

      const rootText = response.text || "{}";
      const params = JSON.parse(rootText);
      res.json(params);
    } catch (err: any) {
      console.error("Failed to generate seed parameters:", err);
      res.status(500).json({ error: err.message || "Failed to generate dynamic prompt settings." });
    }
  });

  // Mount Vite middleware (development) or serve static files (production)
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite livereload middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
