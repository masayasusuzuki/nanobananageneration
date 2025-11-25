import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME } from '../constants';
import { ImageStyle } from '../types';

// API Key storage
let currentApiKey: string | null = null;

export const setApiKey = (key: string) => {
  currentApiKey = key;
};

export const getApiKey = (): string | null => {
  return currentApiKey || process.env.API_KEY || null;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const generateCreativeImage = async (
  personImageBase64: string | null,
  backgroundImageBase64: string | null,
  style: ImageStyle,
  userPrompt: string
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("APIキーが設定されていません。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];

    let promptText = `Generate a high-quality image with the style: "${style}". `;

    // Logic to construct the multimodal prompt
    if (personImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/png', // Assuming PNG/JPEG, Gemini handles standard types
          data: personImageBase64
        }
      });
      promptText += `The first image provided is the REFERENCE PERSON (SUBJECT). 
      CRITICAL: You MUST preserve the facial features, hair, expression, and identity of this person exactly. 
      High fidelity to the source subject is required. `;
    }

    if (backgroundImageBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: backgroundImageBase64
        }
      });
      promptText += `The second image provided is the BACKGROUND/ENVIRONMENT REFERENCE. 
      Use the location, lighting, atmosphere, and mood of this image as the setting. 
      Integrate the subject into this environment naturally. 
      The lighting on the subject must match the background. 
      Do not treat this as a simple layer composition; generate a cohesive single scene. `;
    }

    promptText += `\nAdditional Instructions: ${userPrompt || 'Create a masterpiece.'}`;

    // Add the text prompt part
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          imageSize: '1K',
          aspectRatio: '16:9', // Fixed 16:9
        }
      }
    });

    return processResponse(response);

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error.message || "Failed to generate image.");
  }
};

export const refineImage = async (
  originalImageBase64: string,
  feedback: string,
  referenceImageBase64?: string | null
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("APIキーが設定されていません。");
    }
    const ai = new GoogleGenAI({ apiKey });

    // Ensure we have pure base64
    const base64Data = originalImageBase64.includes(',')
      ? originalImageBase64.split(',')[1]
      : originalImageBase64;

    const parts: any[] = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      }
    ];

    // Add reference image if provided
    if (referenceImageBase64) {
      const refBase64Data = referenceImageBase64.includes(',')
        ? referenceImageBase64.split(',')[1]
        : referenceImageBase64;
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: refBase64Data
        }
      });
    }

    let promptText = `This is a previously generated image.
        User Feedback for refinement: "${feedback}".`;

    if (referenceImageBase64) {
      promptText += `

        The second image is a REFERENCE IMAGE provided by the user.
        Use this reference image to guide the modifications - it may show the desired style, colors, composition, or specific elements the user wants incorporated.`;
    }

    promptText += `

        Task: Re-generate the image incorporating the user's feedback${referenceImageBase64 ? ' and using the reference image as guidance' : ''}.
        Maintain the original subject identity and overall composition unless the feedback specifically asks to change them.
        Ensure the output remains high quality.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          imageSize: '1K',
          aspectRatio: '16:9',
        }
      }
    });

    return processResponse(response);

  } catch (error: any) {
    console.error("Gemini Refinement Error:", error);
    throw new Error(error.message || "Failed to refine image.");
  }
};

// Helper to extract image from response
const processResponse = (response: any): string => {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned from Gemini.");
  }

  const contentParts = candidates[0].content.parts;
  const imagePart = contentParts.find((part: any) => part.inlineData);

  if (imagePart && imagePart.inlineData) {
    return `data:image/png;base64,${imagePart.inlineData.data}`;
  } else {
    const textPart = contentParts.find((part: any) => part.text);
    if (textPart && textPart.text) {
      throw new Error(`Generation failed (Safety/Model Refusal): ${textPart.text}`);
    }
    throw new Error("No image data found in response.");
  }
};