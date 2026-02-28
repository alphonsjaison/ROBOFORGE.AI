export interface RobotDesign {
  name: string;
  purpose: string;
  specifications: string;
  components: { name: string; type: string; description: string }[];
  controlLogic: string;
}

export async function generateRobotDesign(prompt: string): Promise<RobotDesign> {
  try {
    const response = await fetch("/api/generate-design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate design");
    }

    const data = await response.json();
    
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
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate image");
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return null;
}
