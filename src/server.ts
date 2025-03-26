// src/server.ts
import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { errorHandler } from "./middleware/error.middleware";
import { configureRoutes } from "./routes";

// Initialize express app
const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Configure all routes
configureRoutes(app);

// Error handling middleware
app.use(errorHandler);

// Start server if not being run by serverless
if (process.env.NODE_ENV !== "serverless") {
  const port = parseInt(process.env.PORT || "3000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export for serverless
export const handler = serverless(app);

// Export for local development
export default app;
