// src/routes/index.ts
import { Express } from "express";
import authRoutes from "./auth.routes";
import copyGeneratorRoutes from "./copy-generator.routes";
import imageGeneratorRoutes from "./image-generator.routes";
import videoAnalyserRoutes from "./video-analyser.routes";
import emailGeneratorRoutes from "./email-generator.routes";

/**
 * Configure all routes for the application
 */
export const configureRoutes = (app: Express) => {
  // Auth routes
  app.use("/", authRoutes);

  // Copy generator routes
  app.use("/", copyGeneratorRoutes);

  // Image generator routes (now includes examples)
  app.use("/", imageGeneratorRoutes);

  // Video analyser routes
  app.use("/", videoAnalyserRoutes);

  // Email generator routes
  app.use("/", emailGeneratorRoutes);
};
