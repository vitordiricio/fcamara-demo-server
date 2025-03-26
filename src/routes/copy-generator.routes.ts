// src/routes/copy-generator.routes.ts
import { Router } from "express";
import {
  generateCopy,
  getGuidelines,
} from "../controllers/copy-generator.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// All routes are protected
router.use(authenticateToken);

// Get guidelines for dropdowns
router.get("/get-adventures-guideline", getGuidelines);

// Generate copy
router.post("/generate-copy", generateCopy);

export default router;
