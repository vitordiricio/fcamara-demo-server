// src/config.ts
import * as dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  auth: {
    username: process.env.APP_USERNAME,
    password: process.env.APP_PASSWORD,
    jwtSecret: process.env.JWT_SECRET || "default-secret-key-for-development",
  },
  api: {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    fal: process.env.FAL_KEY,
  },
  aws: {
    region: process.env.MY_AWS_REGION || "sa-east-1",
    endpoint: "https://s3.sa-east-1.amazonaws.com",
    credentials: {
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || "",
    },
    bucketName: process.env.MY_AWS_BUCKET_NAME || "",
  },
  externalApis: {
    guidelinesApi:
      "https://script.google.com/macros/s/AKfycbzh2-HM2b0YB1FIQFbkFl69aKroOQ9D69mitsuttkqlKejqYqLDiowy5ZREeEhO0Qq_xQ/exec",
  },
};
