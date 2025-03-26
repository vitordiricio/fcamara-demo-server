// src/controllers/examples.controller.ts
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { uploadFile, getFile, deleteFile } from "../services/s3.service";
import { Example } from "../types";

/**
 * Load examples from S3
 */
export const loadExamples = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const dataJsonKey = "examples/data.json";

    try {
      const examplesData = await getFile(dataJsonKey);
      const examples = JSON.parse(examplesData);
      res.json(examples);
    } catch (err: any) {
      if (err.name === "NoSuchKey") {
        // File not found, return empty list
        res.json([]);
      } else {
        console.error("Error loading examples:", err);
        res.status(500).json({ error: "Failed to load examples" });
      }
    }
  } catch (error) {
    console.error("Error in loadExamples:", error);
    res.status(500).json({ error: "Failed to load examples" });
  }
};

/**
 * Create a new example with image
 */
export const createExample = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image provided" });
      return;
    }

    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      res.status(400).json({
        error: "Title, description, and category are required",
      });
      return;
    }

    const trimmedCategory = category.trim();
    const exampleId = uuidv4();
    const imageKey = `examples/images/${exampleId}-${req.file.originalname}`;

    // Upload image to S3
    const imageUrl = await uploadFile(
      imageKey,
      req.file.buffer,
      req.file.mimetype
    );

    // Load existing examples
    const dataJsonKey = "examples/data.json";
    let examples: Example[] = [];

    try {
      const examplesData = await getFile(dataJsonKey);
      examples = JSON.parse(examplesData);
    } catch (err: any) {
      if (err.name !== "NoSuchKey") {
        console.error("Error reading examples data:", err);
        res.status(500).json({ error: "Failed to read examples data" });
        return;
      }
      // If file doesn't exist, start with empty array
    }

    // Create new example
    const newExample: Example = {
      id: exampleId,
      title,
      imageUrl,
      description,
      category: trimmedCategory,
    };

    // Add to examples array
    examples.push(newExample);

    // Save updated examples back to S3
    await uploadFile(
      dataJsonKey,
      Buffer.from(JSON.stringify(examples)),
      "application/json"
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error in createExample:", error);
    res.status(500).json({ error: "Failed to create example" });
  }
};

/**
 * Delete an example
 */
export const deleteExample = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Load existing examples
    const dataJsonKey = "examples/data.json";
    let examples: Example[] = [];

    try {
      const examplesData = await getFile(dataJsonKey);
      examples = JSON.parse(examplesData);
    } catch (err: any) {
      console.error("Error reading examples data:", err);
      res.status(500).json({ error: "Failed to read examples data" });
      return;
    }

    // Find example to delete
    const exampleToDelete = examples.find((ex) => ex.id === id);

    if (!exampleToDelete) {
      res.status(404).json({ error: "Example not found" });
      return;
    }

    // Remove example from list
    const updatedExamples = examples.filter((ex) => ex.id !== id);

    // Save updated examples back to S3
    await uploadFile(
      dataJsonKey,
      Buffer.from(JSON.stringify(updatedExamples)),
      "application/json"
    );

    // Delete image from S3
    const imageKey = new URL(exampleToDelete.imageUrl).pathname.substring(1);
    await deleteFile(imageKey);

    res.json({ success: true });
  } catch (error) {
    console.error("Error in deleteExample:", error);
    res.status(500).json({ error: "Failed to delete example" });
  }
};
