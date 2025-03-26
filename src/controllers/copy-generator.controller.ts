// src/controllers/copy-generator.controller.ts
import { Request, Response } from "express";
import { generateText } from "../services/openai.service";
import { buildSystemPrompt } from "../utils/prompts";
import {
  fetchAndExtractGuidelines,
  buildChannelsDetails,
  createCopyResponseJsonSchema,
} from "../utils/helpers";
import { ChannelKey } from "../types";

/**
 * Generate copy based on form data
 */
export const generateCopy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      prompt,
      brand,
      targetAudience,
      subSegmentation,
      relationship,
      product,
      creativity,
      frequencyPenalty,
      presencePenalty,
      email,
      push,
      highlights,
      announcements,
      persuasion,
    } = req.body;

    // Build channels array based on requested quantities
    const channelQuantities: { [key in ChannelKey]: number } = {
      Email: email || 0,
      Push: push || 0,
      Highlights: highlights || 0,
      Announcements: announcements || 0,
    };

    // Fetch guidelines
    const { getGuideline } = await fetchAndExtractGuidelines();

    // Get guidelines based on the selected options
    const brandGuidelines = getGuideline("Marca/submarca", brand);
    const productDetails = getGuideline("Produto", product);
    const audienceDescription = getGuideline("Publico-Alvo", targetAudience);
    const relationshipDescription = getGuideline(
      "Relacionamento",
      relationship
    );

    // Build channels details
    const channelsDetails = buildChannelsDetails(
      channelQuantities,
      getGuideline
    );

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(
      brand,
      brandGuidelines,
      targetAudience,
      audienceDescription,
      subSegmentation || "Não informado",
      relationshipDescription,
      product,
      productDetails,
      channelsDetails,
      persuasion
    );

    // Create the JSON schema for response_format
    const jsonSchema = createCopyResponseJsonSchema();

    // Generate content
    const responseContent = await generateText(systemPrompt, prompt, {
      temperature: parseFloat(creativity) || 0.7,
      frequencyPenalty: parseFloat(frequencyPenalty) || 0,
      presencePenalty: parseFloat(presencePenalty) || 0,
      responseFormat: {
        type: "json_schema",
        json_schema: jsonSchema,
      },
    });

    // Parse the response content
    const result = JSON.parse(responseContent);

    // Ensure that channels with zero copies return empty arrays
    const finalResult = {
      Email: result.Email || [],
      Push: result.Push || [],
      Highlights: result.Highlights || [],
      Announcements: result.Announcements || [],
    };

    res.json(finalResult);
  } catch (error: any) {
    console.error("Error in /generate-copy:", error);

    if (error.response) {
      console.error("OpenAI API Error:", error.response.data);
    } else if (error.request) {
      console.error("No response from OpenAI API:", error.request);
    } else {
      console.error("Error:", error.message);
    }

    res
      .status(500)
      .json({ error: "Internal Server Error", errorDetails: error.message });
  }
};

/**
 * Fetch guidelines for dropdown data
 */
export const getGuidelines = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const { data } = await fetchAndExtractGuidelines();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    res.status(500).json({ error: "Failed to fetch dropdown data" });
  }
};
