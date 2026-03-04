import { GoogleGenAI, Type } from "@google/genai";
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

  const { prompt } = req.body;
  console.log(`[API] Design Request: "${prompt}"`);

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[API] CRITICAL: API key is missing from environment variables!");
    const allKeys = Object.keys(process.env);
    const keyLikeNames = allKeys.filter(k => k.toUpperCase().includes('KEY') || k.toUpperCase().includes('GEMINI'));
    
    return res.status(500).json({ 
      error: "API Key not found on Vercel.",
      details: "Environment variable 'API_KEY' is missing.",
      troubleshooting: [
        "1. Go to Vercel Project Settings > Environment Variables",
        "2. Ensure a variable named 'API_KEY' exists with your Gemini key",
        "3. IMPORTANT: You MUST trigger a new Deployment (Redeploy) after adding variables",
        `4. Found similar variables: ${keyLikeNames.join(', ') || 'none'}`
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

    // Using gemini-2.5-flash for better speed/reliability in serverless environments
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    }));

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsed = JSON.parse(text);
    res.status(200).json(parsed);
  } catch (error: any) {
    console.error("[API] Design Error:", error);
    res.status(500).json({ 
      error: error.message || "Failed to generate design",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
