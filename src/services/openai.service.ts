// src/services/openai.service.ts
import { OpenAI } from "openai";
import { CONFIG } from "../config";

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: CONFIG.api.openai,
});

/**
 * Generate text using OpenAI API
 */
export const generateText = async (
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    responseFormat?: any;
  } = {}
) => {
  const {
    model = "gpt-4o",
    temperature = 0.7,
    frequencyPenalty = 0,
    presencePenalty = 0,
    responseFormat = undefined,
  } = options;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    ...(responseFormat && { response_format: responseFormat }),
  });

  return response.choices[0].message?.content || "";
};

/**
 * Generate image description from an image
 */
export const generateImageDescription = async (
  systemPrompt: string,
  imageUrl: string
) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this image in detail" },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
            },
          },
        ],
      },
      {
        role: "system",
        content: systemPrompt,
      },
    ],
  });

  return response.choices[0].message?.content || "";
};
