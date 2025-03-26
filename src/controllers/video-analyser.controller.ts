// src/controllers/video-analyser.controller.ts
import { Request, Response } from "express";
import { videoAnalysisPrompt } from "../utils/prompts";
import { analyzeVideoAndPdf } from "../services/gemini.service";

/**
 * Analyze video with referenced music and PDF with forbidden music
 */
export const analyzeVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { desafio } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const videoFile = files && files.video ? files.video[0] : null;
    const pdfFile = files && files.pdf ? files.pdf[0] : null;

    if (!desafio || !videoFile || !pdfFile) {
      res.status(400).json({
        error: "Missing desafio, video file, or PDF file",
      });
      return;
    }

    // Use Gemini to analyze the video and PDF
    const analysis = await analyzeVideoAndPdf(
      videoFile.buffer,
      videoFile.mimetype,
      pdfFile.buffer,
      pdfFile.mimetype,
      videoAnalysisPrompt
    );

    res.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Video analysis failed" });
  }
};
