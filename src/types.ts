// src/types.ts
import { Request } from "express";

// Auth Types
export interface AuthenticatedRequest extends Request {
  user?: {
    username: string;
  };
}

// Channel Types
export type ChannelKey = "Email" | "Push" | "Highlights" | "Announcements";

// API Data Types
export interface GuidelineItem {
  valor: string;
  diretrizes: string;
}

export interface APIData {
  [key: string]: GuidelineItem[];
}

// Image Generation Types
export interface ImageGenerationParams {
  prompt: string;
  inferenceSteps: number;
  guidanceScale: number;
  width: number;
  height: number;
}

export interface ImageStatusResponse {
  status: string;
  imageUrl?: string;
}

// Example Type
export interface Example {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  category: string;
}

// Form Data Type from the original types.ts
export interface FormDataType {
  brand: string;
  relationship: string;
  product: string;
  communicationObjective: string;
  campaignArguments: string;
  targetAudience: string;
  subSegmentation: string;
  needsAndWants?: string;
  restrictions?: string;
  campaignContext?: string;
  email: number;
  push: number;
  highlights: number;
  announcements: number;
  creativity: number;
  wordRepetition: number;
  topicRepetition: number;
  persuasion: number;
  mainMessage: string;
  cta?: string;
}

export const defaultFormData: FormDataType = {
  brand: "",
  relationship: "",
  product: "",
  communicationObjective: "",
  campaignArguments: "",
  targetAudience: "",
  subSegmentation: "",
  needsAndWants: "",
  restrictions: "",
  campaignContext: "",
  email: 0,
  push: 0,
  highlights: 0,
  announcements: 0,
  creativity: 0,
  wordRepetition: 0,
  topicRepetition: 0,
  persuasion: 0,
  mainMessage: "",
  cta: "",
};
