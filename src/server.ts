// server.ts

import express, { Request, Response, RequestHandler } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { OpenAI } from "openai";
import { buildSystemPrompt } from "./systemPrompt";
import axios from "axios";
import jwt from "jsonwebtoken";
import serverless from "serverless-http";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import multer from "multer";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import { fal } from "@fal-ai/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const streamToString = (stream: Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

const s3Client = new S3Client({
  region: process.env.MY_AWS_REGION,
  endpoint: "https://s3.sa-east-1.amazonaws.com",
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY as string,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
});

const app = express();
const port: number = parseInt(process.env.PORT || "3000", 10);
fal.config({ credentials: process.env.FAL_KEY });

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// Configure OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//Configure gemini
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Define the ChannelKey type
type ChannelKey = "Email" | "Push" | "Highlights" | "Announcements";

// Hardcoded username and password
const USERNAME = process.env.APP_USERNAME;
const PASSWORD = process.env.APP_PASSWORD;

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

// Authentication middleware
const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.sendStatus(401); // Unauthorized
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.sendStatus(403); // Forbidden
      return;
    }
    (req as any).user = user;
    next();
  });
};

app.get("/status", authenticateToken, (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Login endpoint
app.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (username === USERNAME && password === PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET);
    res.json({ token });
  } else {
    res.sendStatus(401);
  }
});

app.get(
  "/get-adventures-guideline",
  authenticateToken,
  async (_req: Request, res: Response) => {
    try {
      const apiUrl =
        "https://script.google.com/macros/s/AKfycbzh2-HM2b0YB1FIQFbkFl69aKroOQ9D69mitsuttkqlKejqYqLDiowy5ZREeEhO0Qq_xQ/exec";
      const { data } = await axios.get(apiUrl);

      res.json(data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      res.status(500).json({ error: "Failed to fetch dropdown data" });
    }
  }
);

// /generate-copy endpoint
app.post(
  "/generate-copy",
  authenticateToken,
  async (req: Request, res: Response) => {
    const {
      prompt,
      brand,
      targetAudience,
      subSegmentation,
      relationship,
      product,
      creativity,
      frequencyPenalty,
      presencePenalty,
      email,
      push,
      highlights,
      announcements,
      persuasion,
    } = req.body;

    try {
      // Build channels array based on requested quantities
      const channelQuantities: { [key in ChannelKey]: number } = {
        Email: email || 0,
        Push: push || 0,
        Highlights: highlights || 0,
        Announcements: announcements || 0,
      };

      const channels: ChannelKey[] = (
        Object.keys(channelQuantities) as ChannelKey[]
      ).filter((key) => channelQuantities[key] > 0);

      // Fetch guidelines from the Google Sheets API
      const apiUrl =
        "https://script.google.com/macros/s/AKfycbzh2-HM2b0YB1FIQFbkFl69aKroOQ9D69mitsuttkqlKejqYqLDiowy5ZREeEhO0Qq_xQ/exec";

      // Fetch data from the API
      const { data } = await axios.get(apiUrl);

      // Function to get the guideline for a given key and value
      const getGuideline = (key: string, value: string): string => {
        const items = data[key];
        if (!items) return "";
        const item = items.find((i: any) => i.valor === value);
        return item ? item.diretrizes : "";
      };

      // Get guidelines based on the selected options
      const brandGuidelines = getGuideline("Marca/submarca", brand);
      const productDetails = getGuideline("Produto", product);
      const audienceDescription = getGuideline("Publico-Alvo", targetAudience);
      const relationshipDescription = getGuideline(
        "Relacionamento",
        relationship
      );

      // Channels guidelines
      const channelsDetails = channels
        .map((channel) => {
          const channelGuidelines = getGuideline("Canais e Assets", channel);
          return `${channel}\n${channelGuidelines}`;
        })
        .join("\n\n");

      // Build the system prompt
      const systemPrompt = buildSystemPrompt(
        brand,
        brandGuidelines,
        targetAudience,
        audienceDescription,
        subSegmentation || "Não informado",
        relationshipDescription,
        product,
        productDetails,
        channelsDetails,
        persuasion
      );

      // Create the JSON schema for response_format
      const jsonSchema = {
        name: "copy_list",
        strict: true,
        schema: {
          type: "object",
          properties: {
            Email: {
              type: "array",
              description:
                "A list of Email copies containing titles and bodies.",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "The title of the Email copy.",
                  },
                  body: {
                    type: "string",
                    description: "The body text of the Email copy.",
                  },
                },
                required: ["title", "body"],
                additionalProperties: false,
              },
            },
            Push: {
              type: "array",
              description:
                "A list of Push copies containing titles and bodies.",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "The title of the Push copy.",
                  },
                  body: {
                    type: "string",
                    description: "The body text of the Push copy.",
                  },
                },
                required: ["title", "body"],
                additionalProperties: false,
              },
            },
            Highlights: {
              type: "array",
              description:
                "A list of Highlights copies containing titles and bodies.",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "The title of the Highlights copy.",
                  },
                  body: {
                    type: "string",
                    description: "The body text of the Highlights copy.",
                  },
                },
                required: ["title", "body"],
                additionalProperties: false,
              },
            },
            Announcements: {
              type: "array",
              description:
                "A list of Announcements copies containing titles and bodies.",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "The title of the Announcements copy.",
                  },
                  body: {
                    type: "string",
                    description: "The body text of the Announcements copy.",
                  },
                },
                required: ["title", "body"],
                additionalProperties: false,
              },
            },
          },
          required: ["Email", "Push", "Highlights", "Announcements"],
          additionalProperties: false,
        },
      };

      // Make the API call to OpenAI
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        response_format: {
          type: "json_schema",
          json_schema: jsonSchema,
        },
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: parseFloat(creativity || "0.7"),
        frequency_penalty: parseFloat(frequencyPenalty || "0"),
        presence_penalty: parseFloat(presencePenalty || "0"),
      });

      // Parse the response content
      const responseContent = response.choices[0].message?.content || "{}";
      const result = JSON.parse(responseContent);

      // Ensure that channels with zero copies return empty arrays
      const finalResult = {
        Email: result.Email || [],
        Push: result.Push || [],
        Highlights: result.Highlights || [],
        Announcements: result.Announcements || [],
      };

      res.json(finalResult);
    } catch (error: any) {
      console.error("Error in /generate-copy:", error);

      if (error.response) {
        // Error from OpenAI API
        console.error("OpenAI API Error:", error.response.data);
      } else if (error.request) {
        // No response from OpenAI API
        console.error("No response from OpenAI API:", error.request);
      } else {
        // Error in setup or elsewhere
        console.error("Error:", error.message);
      }

      res
        .status(500)
        .json({ error: "Internal Server Error", errorDetails: error.message });
    }
  }
);

app.post(
  "/generate-prompt-image",
  upload.single("image"),
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image provided" });
        return;
      }

      // Upload para S3
      const s3UploadParams = {
        Bucket: process.env.MY_AWS_BUCKET_NAME as string,
        Key: `image-to-prompt/${Date.now()}-${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      try {
        await s3Client.send(new PutObjectCommand(s3UploadParams));
      } catch (s3Error) {
        console.error("S3 upload error:", s3Error);
        res.status(500).json({ error: "Failed to upload image" });
        return;
      }

      // Gerar URL da imagem
      const imageUrl = `https://${process.env.MY_AWS_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${s3UploadParams.Key}`;

      const systemPrompt = `
# Role and Goal
You are an expert prompt engineer specializing in photorealistic image generation. Your task is to analyze reference images and create detailed, structured prompts that will generate highly similar results. You will notice that many images you will receive as input has purple elements in it (an object, a clothe, etc). We should try to keep those elements with a similar color, because the brand we are producing this images has purple as main color. 

# In case you receive additional context
The user might send you some text with the image. In this case, you need to consider that, if the user is sending you an image, HE WANTS TO PRESERVE AS MUCH AS POSSIBLE OF THE ORIGINAL IMAGE, and wants only to change a few elements. In this case you should put everything together (the user text/request and image) and return the prompt to generate the image with the changes described by the user. Independently of the language that the user sends us the occasional text always answer in english

# Output Format
- Deliver prompts as comma-separated keywords/phrases
- Structure in key aspects: subject, setting, lighting, details, technical specifications
- Always include: photorealistic style, natural imperfections, proper proportions
- Your answer should be ONLY the prompt and nothing else

# Key Requirements
1. Emphasize photorealism:
   - Natural skin textures and imperfections
   - Realistic object proportions and scale
   - True-to-life lighting and shadows

2. Technical specifications:
   - Resolution (8K)
   - Photography style
   - Lighting setup
   - Camera settings

3. Essential details:
   - Main subject description
   - Environmental elements
   - Color palette
   - Materials and textures
   - Lighting conditions

# Style Guide
- Prioritize natural, candid descriptions
- Avoid artificial or idealized elements
- Include specific technical photography terms
- Maintain real-world physics and proportions

# Example Output
Cozy indoor lifestyle photography, modern living room setting, two people sharing a joyful moment on dark gray couch, genuine laughter and natural interaction, casual business meeting atmosphere, beige button-up shirt, brown tailored pants, soft pink crewneck sweater, natural silver curly hair, white walls with colorful abstract artwork featuring purple and turquoise tones, wooden coffee table with purple notebook and laptop, small plate of red grapes as snack, indoor potted plant in background, sheer white curtains, warm interior lighting, professional lifestyle photography style, 8k resolution, sharp details with soft shadows, high-end commercial look, shallow depth of field`;

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image in detail" },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
          {
            role: "system",
            content: systemPrompt,
          },
        ],
      });

      const prompt = response.choices[0].message?.content;

      res.json({ prompt });
      return;
    } catch (error: any) {
      console.error("Error in /generate-prompt-image:", error);
      res.status(500).json({ error: error.message });
      return;
    }
  }
);

app.post(
  "/generate-image",
  authenticateToken, // Middleware para autenticar o usuário
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt, guidanceScale, inferenceSteps, width, height } = req.body;

      // Submeter a tarefa ao fal.ai
      const { request_id } = await fal.queue.submit("fal-ai/flux-realism", {
        input: {
          prompt,
          guidance_scale: guidanceScale || 3.5,
          num_inference_steps: inferenceSteps || 28,
          image_size: { width: width || 768, height: height || 768 },
        },
      });

      res.json({ requestId: request_id }); // Retorna o Request ID para o frontend
    } catch (error: any) {
      console.error("Error submitting image generation task:", error);
      res
        .status(500)
        .json({ error: "Failed to submit image generation task." });
    }
  }
);

app.get(
  "/image-status/:requestId",
  authenticateToken, // Middleware para autenticar o usuário
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;

      // Consultar o status
      const status = await fal.queue.status("fal-ai/flux-realism", {
        requestId,
      });

      if (status.status === "COMPLETED") {
        // Buscar o resultado final da imagem
        const result = await fal.queue.result("fal-ai/flux-realism", {
          requestId,
        });
        const imageUrl = result.data.images[0]?.url; // Recupera a URL da imagem gerada

        res.json({
          status: status.status,
          imageUrl,
        });
      } else {
        res.json({ status: status.status }); // Status pode ser IN_PROGRESS ou COMPLETED
      }
    } catch (error: any) {
      console.error("Error checking image status:", error);
      res.status(500).json({ error: "Failed to check image status." });
    }
  }
);

app.get(
  "/load-examples",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const params = {
        Bucket: process.env.MY_AWS_BUCKET_NAME as string,
        Key: "examples/data.json",
      };

      const command = new GetObjectCommand(params);

      try {
        const data = await s3Client.send(command);
        const bodyContents = await streamToString(data.Body as Readable);
        const examples = JSON.parse(bodyContents);
        res.json(examples);
      } catch (err: any) {
        if (err.name === "NoSuchKey") {
          // Arquivo não encontrado, retorna lista vazia
          res.json([]);
        } else {
          console.error("Error loading examples:", err);
          res.status(500).json({ error: "Failed to load examples" });
        }
      }
    } catch (error) {
      console.error("Error in /load-examples:", error);
      res.status(500).json({ error: "Failed to load examples" });
    }
  }
);

app.post(
  "/create-example",
  authenticateToken,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image provided" });
        return;
      }

      const { title, description, category } = req.body;

      if (!title || !description || !category) {
        res
          .status(400)
          .json({ error: "Title, description, and category are required" });
        return;
      }

      const trimmedCategory = category.trim();
      const normalizedCategory = trimmedCategory.toLowerCase();

      const exampleId = uuidv4();
      const imageKey = `examples/images/${exampleId}-${req.file.originalname}`;

      // Upload da imagem para o S3
      const imageUploadParams = {
        Bucket: process.env.MY_AWS_BUCKET_NAME as string,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      await s3Client.send(new PutObjectCommand(imageUploadParams));

      // URL da imagem
      const imageUrl = `https://${process.env.MY_AWS_BUCKET_NAME}.s3.${process.env.MY_AWS_REGION}.amazonaws.com/${imageKey}`;

      // Carrega exemplos existentes
      const dataJsonKey = "examples/data.json";
      let examples = [];

      try {
        const data = await s3Client.send(
          new GetObjectCommand({
            Bucket: process.env.MY_AWS_BUCKET_NAME as string,
            Key: dataJsonKey,
          })
        );
        const bodyContents = await streamToString(data.Body as Readable);
        examples = JSON.parse(bodyContents);
      } catch (err: any) {
        if (err.name !== "NoSuchKey") {
          console.error("Error reading examples data:", err);
          res.status(500).json({ error: "Failed to read examples data" });
          return;
        }
        // Se o arquivo não existir, começamos com uma lista vazia
      }

      const newExample = {
        id: exampleId, // Gera um ID único para o exemplo
        title,
        imageUrl,
        description,
        category: trimmedCategory,
      };

      examples.push(newExample);

      // Salva os exemplos atualizados de volta no S3
      const examplesDataParams = {
        Bucket: process.env.MY_AWS_BUCKET_NAME as string,
        Key: dataJsonKey,
        Body: JSON.stringify(examples),
        ContentType: "application/json",
      };

      await s3Client.send(new PutObjectCommand(examplesDataParams));

      res.json({ success: true });
    } catch (error) {
      console.error("Error in /create-example:", error);
      res.status(500).json({ error: "Failed to create example" });
    }
  }
);

app.delete(
  "/delete-example/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Carrega os exemplos existentes
      const dataJsonKey = "examples/data.json";
      let examples = [];

      try {
        const data = await s3Client.send(
          new GetObjectCommand({
            Bucket: process.env.MY_AWS_BUCKET_NAME as string,
            Key: dataJsonKey,
          })
        );
        const bodyContents = await streamToString(data.Body as Readable);
        examples = JSON.parse(bodyContents);
      } catch (err: any) {
        console.error("Error reading examples data:", err);
        res.status(500).json({ error: "Failed to read examples data" });
        return;
      }

      // Encontra o exemplo a ser excluído
      const exampleToDelete = examples.find((ex: any) => ex.id === id);

      if (!exampleToDelete) {
        res.status(404).json({ error: "Example not found" });
        return;
      }

      // Remove o exemplo da lista
      const updatedExamples = examples.filter((ex: any) => ex.id !== id);

      // Salva a lista atualizada de volta no S3
      const examplesDataParams = {
        Bucket: process.env.MY_AWS_BUCKET_NAME as string,
        Key: dataJsonKey,
        Body: JSON.stringify(updatedExamples),
        ContentType: "application/json",
      };

      await s3Client.send(new PutObjectCommand(examplesDataParams));

      // Exclui a imagem do S3
      const imageKey = new URL(exampleToDelete.imageUrl).pathname.substring(1); // Remove a barra inicial '/'
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.MY_AWS_BUCKET_NAME as string,
          Key: imageKey,
        })
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error in /delete-example:", error);
      res.status(500).json({ error: "Failed to delete example" });
    }
  }
);

app.post(
  "/analyse-video",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { desafio } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const videoFile = files && files.video ? files.video[0] : null;
      const pdfFile = files && files.pdf ? files.pdf[0] : null;

      if (!desafio || !videoFile || !pdfFile) {
        res
          .status(400)
          .json({ error: "Missing desafio, video file, or PDF file" });
        return;
      }

      // Configure Gemini model
      const model = genai.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.1,
        },
      });

      // Prepare files for Gemini
      const videoFileData = {
        inlineData: {
          data: videoFile.buffer.toString("base64"),
          mimeType: videoFile.mimetype,
        },
      };

      const pdfFileData = {
        inlineData: {
          data: pdfFile.buffer.toString("base64"),
          mimeType: pdfFile.mimetype,
        },
      };

      // Create analysis prompt
      const prompt = `
      Perform a structured analysis by processing two distinct sources separately: the video content and the provided PDF database.
      
      1. Video Content Analysis:
         a. Music Detection:
            - Clearly identify if intentional music exists (exclude ambient sounds/sound effects).
            - Reject any uncertain cases as "no music present".
            - Consider single-instrument pieces as music only if they are intentionally composed.
         b. Music Identification (ONLY if music is confirmed):
            - Provide the exact track title with correct capitalization.
            - List the primary artist/composer.
            - Return "No song identified" if the title/artist cannot be definitively determined.
      
      2. PDF Database Analysis:
         - Independently analyze the provided PDF document, which contains a list of forbidden music tracks.
         - Treat the PDF as the definitive authority for identifying forbidden tracks.
      
      3. Cross-Referencing and Authorization Check:
         - After separately analyzing the video and the PDF, cross-reference the music identified from the video with the forbidden tracks listed in the PDF.
         - If an exact match (both title and artist) is found in the PDF, return "Forbidden".
         - For any non-matches or uncertainties, return "Permitted".
      
      HTML Response Requirements:
      • Begin directly with <h1>Analysis Results</h1>
      • Use unordered lists with <ul> and <li> elements
      • Maintain this exact structure:
         <h1>Analysis Results</h1>
         <ul>
           <li><strong>Music Present:</strong> Yes/No</li>
           <li><strong>Track Title:</strong> [value/N/A]</li>
           <li><strong>Artist:</strong> [value/N/A]</li>
           <li><strong>Authorization Status:</strong> [Forbidden/Permitted/N/A when no sound identified]</li>
         </ul>
      • Your final answer (above) should only contain the VIDEO MUSIC TRACK INFORMATION. YOU SHOULD ONLY USE THE PDF TO CHECK IF THE SOUND IS FORBIDEN OR NOT, AND NOTHING ELSE. THE ANSWER SHOULD BE ABOUT THE VIDEO SOUNDTRACK   
      • No additional elements, styling, or attributes
      • Absolute prohibition on markdown or code block syntax
      • Exclude all HTML document structure tags
      • You CAN NOT RETURN ANY ADDITIONAL THING BESIDES THE ABOVE STRUCTURE
      `;

      // Get analysis result
      const result = await model.generateContent([
        prompt,
        videoFileData,
        pdfFileData,
      ]);
      let analysis = await result.response.text();

      analysis = analysis
        .replace(/```html/g, "")
        .replace(/```/g, "")
        .trim();

      res.json({ analysis });
      return;
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Video analysis failed" });
      return;
    }
  }
);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

// module.exports.handler = serverless(app);
