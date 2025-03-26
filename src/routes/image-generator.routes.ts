// src/routes/image-generator.routes.ts
import { Router } from "express";
import multer from "multer";
import {
  generatePromptFromImage,
  generateImage,
  checkImageStatus,
} from "../controllers/image-generator.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected
router.use(authenticateToken);

// Generate prompt from image
router.post(
  "/generate-prompt-image",
  upload.single("image"),
  generatePromptFromImage
);

// Generate image from prompt
router.post("/generate-image", generateImage);

// Check image generation status
router.get("/image-status/:requestId", checkImageStatus);

export default router;
