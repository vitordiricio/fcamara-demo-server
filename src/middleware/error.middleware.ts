// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error:", err);

  // Handle different types of errors
  if (err.name === "ValidationError") {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err.name === "UnauthorizedError") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Default to 500 server error
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
};
