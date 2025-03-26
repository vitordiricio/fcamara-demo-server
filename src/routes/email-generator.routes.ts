// src/routes/email-generator.routes.ts
import express from "express";
import multer from "multer";
import { generateEmail } from "../controllers/email-generator.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Adding authentication to the email generation route
router.post(
  "/generate-email",
  authenticateToken, // Added authentication middleware
  upload.fields([{ name: "briefingPdf", maxCount: 1 }]),
  generateEmail
);

export default router;
