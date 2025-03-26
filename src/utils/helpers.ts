// src/utils/helpers.ts
import { ChannelKey } from "../types";
import axios from "axios";
import { CONFIG } from "../config";

/**
 * Creates a JSON schema for OpenAI response format
 */
export const createCopyResponseJsonSchema = () => {
  return {
    name: "copy_list",
    strict: true,
    schema: {
      type: "object",
      properties: {
        Email: {
          type: "array",
          description: "A list of Email copies containing titles and bodies.",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The title of the Email copy.",
              },
              body: {
                type: "string",
                description: "The body text of the Email copy.",
              },
            },
            required: ["title", "body"],
            additionalProperties: false,
          },
        },
        Push: {
          type: "array",
          description: "A list of Push copies containing titles and bodies.",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The title of the Push copy.",
              },
              body: {
                type: "string",
                description: "The body text of the Push copy.",
              },
            },
            required: ["title", "body"],
            additionalProperties: false,
          },
        },
        Highlights: {
          type: "array",
          description:
            "A list of Highlights copies containing titles and bodies.",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The title of the Highlights copy.",
              },
              body: {
                type: "string",
                description: "The body text of the Highlights copy.",
              },
            },
            required: ["title", "body"],
            additionalProperties: false,
          },
        },
        Announcements: {
          type: "array",
          description:
            "A list of Announcements copies containing titles and bodies.",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The title of the Announcements copy.",
              },
              body: {
                type: "string",
                description: "The body text of the Announcements copy.",
              },
            },
            required: ["title", "body"],
            additionalProperties: false,
          },
        },
      },
      required: ["Email", "Push", "Highlights", "Announcements"],
      additionalProperties: false,
    },
  };
};

/**
 * Fetches guidelines from external API and returns a function to get specific guidelines
 */
export const fetchAndExtractGuidelines = async () => {
  try {
    const { data } = await axios.get(CONFIG.externalApis.guidelinesApi);

    if (!data.success) {
      throw new Error("Failed to fetch valid guidelines data");
    }

    return {
      // Function to get the guideline for a given key and value
      getGuideline: (key: string, value: string): string => {
        const items = data.data[key];
        if (!items) return "";
        const item = items.find((i: any) => i.valor === value);
        return item ? item.diretrizes : "";
      },
      // Return the raw data for other uses
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching guidelines:", error);
    throw error;
  }
};

/**
 * Builds channels details string based on requested quantities
 */
export const buildChannelsDetails = (
  channelQuantities: { [key in ChannelKey]: number },
  getGuideline: (key: string, value: string) => string
): string => {
  const channels: ChannelKey[] = (
    Object.keys(channelQuantities) as ChannelKey[]
  ).filter((key) => channelQuantities[key] > 0);

  return channels
    .map((channel) => {
      const channelGuidelines = getGuideline("Canais e Assets", channel);
      return `${channel}\n${channelGuidelines}`;
    })
    .join("\n\n");
};
