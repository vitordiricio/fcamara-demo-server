// src/routes/index.ts
import { Express } from "express";
import authRoutes from "./auth.routes";
import copyGeneratorRoutes from "./copy-generator.routes";
import imageGeneratorRoutes from "./image-generator.routes";
import examplesRoutes from "./examples.routes";
import videoAnalyserRoutes from "./video-analyser.routes";

/**
 * Configure all routes for the application
 */
export const configureRoutes = (app: Express) => {
  // Auth routes
  app.use("/", authRoutes);

  // Copy generator routes
  app.use("/", copyGeneratorRoutes);

  // Image generator routes
  app.use("/", imageGeneratorRoutes);

  // Examples routes
  app.use("/", examplesRoutes);

  // Video analyser routes
  app.use("/", videoAnalyserRoutes);
};
