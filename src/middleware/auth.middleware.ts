// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config";
import { AuthenticatedRequest } from "../types";

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.sendStatus(401); // Unauthorized
    return;
  }

  jwt.verify(token, CONFIG.auth.jwtSecret, (err: any, user: any) => {
    if (err) {
      res.sendStatus(403); // Forbidden
      return;
    }
    (req as AuthenticatedRequest).user = user;
    next();
  });
};
