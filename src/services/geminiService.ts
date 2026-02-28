import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface RobotDesign {
  name: string;
  purpose: string;
  specifications: string;
  components: { name: string; type: string; description: string }[];
  controlLogic: string;
}

function extractJson(text: string) {
  try {
    // Attempt to find JSON block if it's wrapped in markdown
    const jsonMatch = text.match(/```json\s?([\s\S]*?)\s?```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    // Remove markdown backticks if present
    const cleaned = jsonStr.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from response:", text);
    throw new Error("Invalid response format from AI");
  }
}

export async function generateRobotDesign(prompt: string): Promise<RobotDesign> {
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

    const data = extractJson(response.text || "{}");
    
    // Ensure all fields exist to prevent UI crashes
    return {
      name: data.name || "Unnamed Robot",
      purpose: data.purpose || "General Purpose",
      specifications: data.specifications || "No specifications provided.",
      components: Array.isArray(data.components) ? data.components : [],
      controlLogic: data.controlLogic || "# No control logic generated."
    };
  } catch (error) {
    console.error("Design generation failed:", error);
    throw error;
  }
}

export async function generateRobotImage(description: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A highly detailed, professional engineering concept render of a robot: ${description}. Cinematic lighting, technical blueprint style background, 4k, photorealistic.` }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return null;
}
