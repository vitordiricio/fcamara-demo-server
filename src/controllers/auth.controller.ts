// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config";

/**
 * Handle user login
 */
export const login = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (username === CONFIG.auth.username && password === CONFIG.auth.password) {
    const token = jwt.sign({ username }, CONFIG.auth.jwtSecret);
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
};

/**
 * Status check endpoint (requires authentication)
 */
export const checkStatus = (_req: Request, res: Response): void => {
  res.json({ status: "ok" });
};
