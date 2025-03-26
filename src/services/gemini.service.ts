// src/services/gemini.service.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "../config";

// Initialize Gemini client
export const genai = new GoogleGenerativeAI(CONFIG.api.gemini!);

/**
 * Analyze video and PDF with Gemini
 */
export const analyzeVideoAndPdf = async (
  videoBuffer: Buffer,
  videoMimeType: string,
  pdfBuffer: Buffer,
  pdfMimeType: string,
  prompt: string
) => {
  const model = genai.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.1,
    },
  });

  // Prepare files for Gemini
  const videoFileData = {
    inlineData: {
      data: videoBuffer.toString("base64"),
      mimeType: videoMimeType,
    },
  };

  const pdfFileData = {
    inlineData: {
      data: pdfBuffer.toString("base64"),
      mimeType: pdfMimeType,
    },
  };

  // Get analysis result
  const result = await model.generateContent([
    prompt,
    videoFileData,
    pdfFileData,
  ]);
  let analysis = await result.response.text();

  // Clean up response
  return analysis
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();
};

/**
 * Generate HTML email from briefing PDF using Gemini
 */
export const generateEmailFromPdf = async (
  pdfBuffer: Buffer,
  pdfMimeType: string,
  additionalContext: string,
  prompt: string
) => {
  const model = genai.getGenerativeModel({
    model: "gemini-2.5-pro-exp-03-25",
    generationConfig: {
      temperature: 0.2,
    },
  });

  // Prepare briefing PDF file for Gemini
  const pdfFileData = {
    inlineData: {
      data: pdfBuffer.toString("base64"),
      mimeType: pdfMimeType,
    },
  };

  // Include additional context if provided
  const contextPrompt = additionalContext
    ? `Additional context: ${additionalContext}\n\n${prompt}`
    : prompt;

  // Get generation result
  const result = await model.generateContent([contextPrompt, pdfFileData]);
  let htmlContent = await result.response.text();

  // Clean up response to ensure we only return clean HTML
  return htmlContent
    .replace(/```html/g, "")
    .replace(/```/g, "")
    .trim();
};
