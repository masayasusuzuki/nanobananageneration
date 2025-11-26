import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME } from '../constants';
import { ImageStyle, LPSection, LPTone, LPAspectRatio } from '../types';

// API Key storage
const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const setApiKey = (key: string) => {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
};

export const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || process.env.API_KEY || null;
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

// LP Section Generation
export const generateLPSection = async (
  section: LPSection,
  tone: LPTone,
  materialImages: (string | null)[],
  toneReferenceImage: string | null,
  contentText: string,
  additionalPrompt: string,
  existingBlocks: (string | null)[] = [],
  aspectRatio: LPAspectRatio = LPAspectRatio.WIDE
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("APIキーが設定されていません。");
    }
    const ai = new GoogleGenAI({ apiKey });

    const parts: any[] = [];

    // Section-specific prompt construction
    const sectionDescriptions: Record<LPSection, string> = {
      [LPSection.HERO]: 'Hero section with main visual, headline, and call-to-action. This is the first thing visitors see.',
      [LPSection.PROBLEM]: 'Problem/Pain point section highlighting user challenges and frustrations. Use empathetic messaging and relatable imagery.',
      [LPSection.SOLUTION]: 'Solution section presenting how the product/service solves the problems. Show the path from problem to resolution.',
      [LPSection.BEFORE_AFTER]: 'Before/After comparison section showing transformation. Use split layout or timeline to visualize the change.',
      [LPSection.FEATURES]: 'Features section showcasing product/service benefits with icons or images.',
      [LPSection.TESTIMONIALS]: 'Testimonials section with customer reviews and photos.',
      [LPSection.CTA]: 'Call-to-action section with compelling button and supporting text.',
      [LPSection.ABOUT]: 'About section introducing the company or service.',
      [LPSection.PHILOSOPHY]: 'Philosophy/Mission section presenting company values, vision, and mission statement with inspiring visuals.',
      [LPSection.PRICING]: 'Pricing section with plan comparison and pricing cards.',
      [LPSection.FAQ]: 'FAQ section with common questions and answers.',
      [LPSection.FOOTER]: 'Footer section with navigation links and contact info.',
      [LPSection.OTHER]: 'Custom section based on user specifications. Follow the additional instructions carefully.',
    };

    const toneDescriptions: Record<LPTone, string> = {
      [LPTone.PROFESSIONAL]: 'professional, trustworthy, corporate feel with clean typography and muted colors',
      [LPTone.CASUAL]: 'casual, friendly, approachable with warm colors and relaxed layout',
      [LPTone.LUXURY]: 'luxurious, premium, elegant with gold accents, serif fonts, and rich textures',
      [LPTone.PLAYFUL]: 'playful, fun, colorful with bold shapes, bright gradients, and energetic layout',
      [LPTone.MINIMAL]: 'minimal, clean, lots of white space, simple typography, subtle colors',
      [LPTone.BOLD]: 'bold, impactful, large typography, strong contrasts, dramatic visuals',
    };

    let promptText = `Generate a high-quality landing page section image.

SECTION TYPE: ${section} - ${sectionDescriptions[section]}
DESIGN TONE: ${toneDescriptions[tone]}

`;

    // Add existing blocks for consistency
    const validExistingBlocks = existingBlocks.filter(img => img !== null);
    if (validExistingBlocks.length > 0) {
      promptText += `EXISTING PAGE BLOCKS FOR DESIGN CONSISTENCY:\n`;
      promptText += `The following ${validExistingBlocks.length} image(s) are EXISTING BLOCKS from the same landing page. You MUST match their design style exactly:\n`;
      promptText += `- Match the exact color palette, typography, spacing, and visual style\n`;
      promptText += `- Ensure the new section looks like it belongs to the same page\n`;
      promptText += `- Maintain consistent button styles, heading styles, and overall aesthetic\n\n`;

      validExistingBlocks.forEach((img) => {
        const imgBase64 = img!.includes(',') ? img!.split(',')[1] : img!;
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imgBase64
          }
        });
      });
    }

    // Add tone reference image if provided
    if (toneReferenceImage) {
      const toneBase64 = toneReferenceImage.includes(',')
        ? toneReferenceImage.split(',')[1]
        : toneReferenceImage;
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: toneBase64
        }
      });
      promptText += `The next image is a TONE/STYLE REFERENCE. Match the color palette, typography style, and overall aesthetic from this reference image.\n\n`;
    }

    // Add material images
    const validMaterials = materialImages.filter(img => img !== null);
    if (validMaterials.length > 0) {
      promptText += `The following ${validMaterials.length} image(s) are MATERIAL/CONTENT images to incorporate into the design:\n`;
      validMaterials.forEach((img, index) => {
        const imgBase64 = img!.includes(',') ? img!.split(',')[1] : img!;
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imgBase64
          }
        });
        promptText += `- Image ${index + 1}: Use this as visual content in the section\n`;
      });
      promptText += '\n';
    }

    // Add content text
    if (contentText.trim()) {
      promptText += `TEXT CONTENT TO INCLUDE:
${contentText}

`;
    }

    // Add additional instructions
    if (additionalPrompt.trim()) {
      promptText += `ADDITIONAL INSTRUCTIONS: ${additionalPrompt}\n\n`;
    }

    promptText += `
IMPORTANT GUIDELINES:
- Create a web design mockup/screenshot style image
- The design should look like a real website section
- Include appropriate UI elements for this section type
- Text should be readable and well-placed
- Follow modern web design best practices
- Make it visually appealing and conversion-focused
- Output should be a single cohesive section design`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          imageSize: '1K',
          aspectRatio: aspectRatio,
        }
      }
    });

    return processResponse(response);

  } catch (error: any) {
    console.error("Gemini LP Generation Error:", error);
    throw new Error(error.message || "Failed to generate LP section.");
  }
};

// LP Section Refinement
export const refineLPSection = async (
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

    let promptText = `This is a previously generated landing page section design.
User Feedback for refinement: "${feedback}".`;

    if (referenceImageBase64) {
      promptText += `

The second image is a REFERENCE IMAGE. Use this to guide the modifications.`;
    }

    promptText += `

Task: Re-generate the LP section incorporating the user's feedback.
Maintain the overall layout and section type unless feedback specifically asks to change them.
Ensure the output remains a high-quality web design mockup.`;

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
    console.error("Gemini LP Refinement Error:", error);
    throw new Error(error.message || "Failed to refine LP section.");
  }
};

// Image Edit/Adjustment
export const editImage = async (
  originalImageBase64: string,
  editPrompt: string,
  originalWidth: number,
  originalHeight: number,
  referenceImageBase64?: string | null
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("APIキーが設定されていません。");
    }
    const ai = new GoogleGenAI({ apiKey });

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

    let promptText = `This is an image that needs to be edited/adjusted.

`;

    if (referenceImageBase64) {
      promptText += `The second image is a REFERENCE IMAGE provided by the user.
Use this reference image to guide the modifications - it may show the desired style, colors, composition, or specific elements the user wants incorporated.

`;
    }

    promptText += `User's Edit Instructions: "${editPrompt}"

Task: Apply the requested edits/adjustments to the image${referenceImageBase64 ? ' using the reference image as guidance' : ''}.

IMPORTANT GUIDELINES:
- Follow the user's instructions carefully
- Maintain the overall composition and subject unless asked to change them
- Apply edits naturally and professionally
- Keep the image quality high
- Common adjustments include: color correction, lighting, retouching, style changes, object removal/addition, background changes, etc.
- Output a high-quality edited image`;

    parts.push({ text: promptText });

    // Determine aspect ratio from original dimensions
    const ratio = originalWidth / originalHeight;
    let aspectRatio: string;
    if (ratio > 1.5) {
      aspectRatio = '16:9';
    } else if (ratio < 0.7) {
      aspectRatio = '9:16';
    } else if (ratio > 1.2) {
      aspectRatio = '4:3';
    } else if (ratio < 0.85) {
      aspectRatio = '3:4';
    } else {
      aspectRatio = '1:1';
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          imageSize: '1K',
          aspectRatio: aspectRatio,
        }
      }
    });

    return processResponse(response);

  } catch (error: any) {
    console.error("Gemini Image Edit Error:", error);
    throw new Error(error.message || "Failed to edit image.");
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