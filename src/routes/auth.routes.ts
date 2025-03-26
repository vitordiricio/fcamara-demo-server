// src/routes/auth.routes.ts
import { Router } from "express";
import { login, checkStatus } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/login", login);

// Protected routes
router.get("/status", authenticateToken, checkStatus);

export default router;
