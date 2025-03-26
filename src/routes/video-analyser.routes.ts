// src/routes/video-analyser.routes.ts
import express from "express";
import multer from "multer";
import { analyzeVideo } from "../controllers/video-analyser.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Adding authentication to the video analysis route
router.post(
  "/analyse-video",
  authenticateToken, // Added authentication middleware
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  analyzeVideo
);

export default router;
