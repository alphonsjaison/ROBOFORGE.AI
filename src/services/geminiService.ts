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

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      let errorMessage = "Failed to generate design";
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const text = await response.text();
        errorMessage = `Server Error (${response.status}): ${text.slice(0, 100)}`;
      }
      throw new Error(errorMessage);
    }

    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(`Expected JSON response but received: ${text.slice(0, 100)}`);
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
  } catch (error: any) {
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

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate image");
      } else {
        const text = await response.text();
        throw new Error(`Server Error (${response.status}): ${text.slice(0, 100)}`);
      }
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return null;
}
