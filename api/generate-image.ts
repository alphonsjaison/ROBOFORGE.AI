import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { description } = req.body;
  console.log(`[API] Image Request: "${description}"`);

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[API] CRITICAL: API key is missing!");
    const allKeys = Object.keys(process.env);
    const keyLikeNames = allKeys.filter(k => k.toUpperCase().includes('KEY') || k.toUpperCase().includes('GEMINI'));

    return res.status(500).json({ 
      error: "API Key not found on Vercel.",
      troubleshooting: [
        "Ensure 'API_KEY' is set in Vercel Settings and you have REDEPLOYED.",
        `Found similar variables: ${keyLikeNames.join(', ') || 'none'}`
      ]
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Retry helper for 503 and 429 errors
    const withRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
      let lastError;
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error: any) {
          lastError = error;
          const is503 = error.message?.includes("503") || error.status === 503;
          const is429 = error.message?.includes("429") || error.status === 429 || error.message?.includes("quota");
          
          if ((is503 || is429) && i < maxRetries - 1) {
            let delay = Math.pow(2, i) * 2000;
            const match = error.message?.match(/retry in ([\d.]+)s/i);
            if (match) {
              delay = (parseFloat(match[1]) + 1) * 1000;
            }
            
            console.warn(`[API] Gemini ${is429 ? '429' : '503'} error. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    };

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A highly detailed, professional engineering concept render of a robot: ${description}. Cinematic lighting, technical blueprint style background, 4k, photorealistic.` }]
      }
    }));

    let imageUrl = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("No image data found in Gemini response");
    }
    
    res.status(200).json({ imageUrl });
  } catch (error: any) {
    console.error("[API] Image Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
