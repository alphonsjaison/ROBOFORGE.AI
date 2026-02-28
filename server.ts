import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini on the server
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey || "" });

  // API Routes
  app.post("/api/generate-design", async (req, res) => {
    const { prompt } = req.body;
    console.log(`[Server] Generating design for: "${prompt}"`);
    
    if (!apiKey) {
      console.error("[Server] API_KEY is missing!");
      return res.status(500).json({ error: "API_KEY not configured on server" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Design a robot based on this description: ${prompt}. 
        Provide technical details, components, and basic control code.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              purpose: { type: Type.STRING },
              specifications: { type: Type.STRING, description: "Detailed markdown description of the robot's specs" },
              components: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["name", "type", "description"]
                }
              },
              controlLogic: { type: Type.STRING, description: "Arduino or Python code snippet for basic movement" }
            },
            required: ["name", "purpose", "specifications", "components", "controlLogic"]
          }
        }
      });

      const text = response.text;
      console.log("[Server] Received response from Gemini");
      
      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }

      try {
        const parsed = JSON.parse(text);
        res.json(parsed);
      } catch (parseError) {
        console.error("[Server] JSON Parse Error. Raw text:", text);
        throw new Error("Failed to parse AI response as JSON.");
      }
    } catch (error: any) {
      console.error("[Server] Design generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate design" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    const { description } = req.body;
    console.log(`[Server] Generating image for: "${description}"`);

    if (!apiKey) {
      console.error("[Server] API_KEY is missing!");
      return res.status(500).json({ error: "API_KEY not configured on server" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: `A highly detailed, professional engineering concept render of a robot: ${description}. Cinematic lighting, technical blueprint style background, 4k, photorealistic.` }]
        }
      });

      console.log("[Server] Received image response from Gemini");
      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        console.warn("[Server] No image data found in Gemini response");
      }
      
      res.json({ imageUrl });
    } catch (error: any) {
      console.error("[Server] Image generation failed:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
