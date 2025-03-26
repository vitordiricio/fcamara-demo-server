// src/routes/examples.routes.ts
import { Router } from "express";
import multer from "multer";
import {
  loadExamples,
  createExample,
  deleteExample,
} from "../controllers/examples.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected
router.use(authenticateToken);

// Load examples
router.get("/load-examples", loadExamples);

// Create example
router.post("/create-example", upload.single("image"), createExample);

// Delete example
router.delete("/delete-example/:id", deleteExample);

export default router;
