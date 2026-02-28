import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { description } = req.body;
  console.log(`[API] Generating image for: "${description}"`);

  if (!apiKey) {
    console.error("[API] API_KEY is missing!");
    return res.status(500).json({ error: "API_KEY not configured on server" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A highly detailed, professional engineering concept render of a robot: ${description}. Cinematic lighting, technical blueprint style background, 4k, photorealistic.` }]
      }
    });

    let imageUrl = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      console.warn("[API] No image data found in Gemini response");
    }
    
    res.status(200).json({ imageUrl });
  } catch (error: any) {
    console.error("[API] Image generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
