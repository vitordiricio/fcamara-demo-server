// src/routes/image-generator.routes.ts
import express from "express";
import multer from "multer";
import {
  generatePromptFromImage,
  generateImage,
  checkImageStatus,
  loadExamples,
  createExample,
  deleteExample,
} from "../controllers/image-generator.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected
router.use(authenticateToken);

// Image generation routes
router.post(
  "/generate-prompt-image",
  upload.single("image"),
  generatePromptFromImage
);
router.post("/generate-image", generateImage);
router.get("/image-status/:requestId", checkImageStatus);

// Examples management routes (now part of image generator module)
router.get("/load-examples", loadExamples);
router.post("/create-example", upload.single("image"), createExample);
router.delete("/delete-example/:id", deleteExample);

export default router;
