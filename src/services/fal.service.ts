// src/services/fal.service.ts
import { fal } from "@fal-ai/client";
import { CONFIG } from "../config";
import { ImageGenerationParams } from "../types";

// Configure fal client
fal.config({ credentials: CONFIG.api.fal });

/**
 * Submit an image generation task to fal.ai
 */
export const submitImageGenerationTask = async (
  params: ImageGenerationParams
) => {
  const { prompt, guidanceScale, inferenceSteps, width, height } = params;

  const { request_id } = await fal.queue.submit("fal-ai/flux-realism", {
    input: {
      prompt,
      guidance_scale: guidanceScale || 3.5,
      num_inference_steps: inferenceSteps || 28,
      image_size: { width: width || 768, height: height || 768 },
    },
  });

  return { requestId: request_id };
};

/**
 * Check the status of an image generation task
 */
export const checkImageGenerationStatus = async (requestId: string) => {
  const status = await fal.queue.status("fal-ai/flux-realism", {
    requestId,
  });

  if (status.status === "COMPLETED") {
    const result = await fal.queue.result("fal-ai/flux-realism", {
      requestId,
    });
    const imageUrl = result.data.images[0]?.url;

    return {
      status: status.status,
      imageUrl,
    };
  }

  return { status: status.status };
};
