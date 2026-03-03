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
    const availableKeys = Object.keys(process.env).filter(k => k.includes('KEY')).join(', ');
    return res.status(500).json({ 
      error: "API Key not found on Vercel.",
      details: `Please ensure you have an environment variable named 'API_KEY'. (Found keys: ${availableKeys || 'none'})`
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Using gemini-2.5-flash for better speed/reliability in serverless environments
    const response = await ai.models.generateContent({
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
    });

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
