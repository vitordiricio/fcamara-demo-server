// src/controllers/email-generator.controller.ts
import { Request, Response } from "express";
import { generateEmailFromPdf } from "../services/gemini.service";
import { emailGenerationPrompt } from "../utils/prompts";

/**
 * Generate email HTML from briefing PDF
 */
export const generateEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { additionalContext } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const briefingPdfFile =
      files && files.briefingPdf ? files.briefingPdf[0] : null;

    if (!briefingPdfFile) {
      res.status(400).json({
        error: "Missing briefing PDF file",
      });
      return;
    }

    // Use Gemini to generate HTML email from the PDF
    const htmlContent = await generateEmailFromPdf(
      briefingPdfFile.buffer,
      briefingPdfFile.mimetype,
      additionalContext || "",
      emailGenerationPrompt
    );

    res.json({ html: htmlContent });
  } catch (error: any) {
    console.error("Email generation error:", error);
    res.status(500).json({
      error: "Email generation failed",
      details: error.message,
    });
  }
};
