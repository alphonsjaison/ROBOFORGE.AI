import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt } = req.body;
  console.log(`[API] Generating design for: "${prompt}"`);

  if (!apiKey) {
    console.error("[API] API_KEY is missing!");
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
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    try {
      const parsed = JSON.parse(text);
      res.status(200).json(parsed);
    } catch (parseError) {
      console.error("[API] JSON Parse Error. Raw text:", text);
      throw new Error("Failed to parse AI response as JSON.");
    }
  } catch (error: any) {
    console.error("[API] Design generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate design" });
  }
}
