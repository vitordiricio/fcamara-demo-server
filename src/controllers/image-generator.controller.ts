// src/controllers/image-generator.controller.ts
import { Request, Response } from "express";
import { imageDescriptionPrompt } from "../utils/prompts";
import { uploadFile } from "../services/s3.service";
import { generateImageDescription } from "../services/openai.service";
import {
  submitImageGenerationTask,
  checkImageGenerationStatus,
} from "../services/fal.service";
import { ImageGenerationParams } from "../types";

/**
 * Generate image prompt from uploaded image
 */
export const generatePromptFromImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image provided" });
      return;
    }

    // Upload to S3
    const s3Key = `image-to-prompt/${Date.now()}-${req.file.originalname}`;
    const imageUrl = await uploadFile(
      s3Key,
      req.file.buffer,
      req.file.mimetype
    );

    // Generate prompt using OpenAI's image understanding
    const prompt = await generateImageDescription(
      imageDescriptionPrompt,
      imageUrl
    );

    res.json({ prompt });
  } catch (error: any) {
    console.error("Error in generatePromptFromImage:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate image based on prompt and parameters
 */
export const generateImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const params = req.body as ImageGenerationParams;

    // Submit image generation task
    const result = await submitImageGenerationTask(params);

    res.json({ requestId: result.requestId });
  } catch (error: any) {
    console.error("Error submitting image generation task:", error);
    res.status(500).json({ error: "Failed to submit image generation task." });
  }
};

/**
 * Check image generation status
 */
export const checkImageStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { requestId } = req.params;

    // Check status of image generation task
    const status = await checkImageGenerationStatus(requestId);

    res.json(status);
  } catch (error: any) {
    console.error("Error checking image status:", error);
    res.status(500).json({ error: "Failed to check image status." });
  }
};
