// src/services/s3.service.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { CONFIG } from "../config";

// Initialize S3 client
export const s3Client = new S3Client({
  region: CONFIG.aws.region,
  endpoint: CONFIG.aws.endpoint,
  credentials: CONFIG.aws.credentials,
});

/**
 * Converts a readable stream to a string
 */
export const streamToString = (stream: Readable): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

/**
 * Upload a file to S3
 */
export const uploadFile = async (
  key: string,
  data: Buffer,
  contentType: string
): Promise<string> => {
  const uploadParams = {
    Bucket: CONFIG.aws.bucketName,
    Key: key,
    Body: data,
    ContentType: contentType,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  // Return the URL
  return `https://${CONFIG.aws.bucketName}.s3.${CONFIG.aws.region}.amazonaws.com/${key}`;
};

/**
 * Get a file from S3
 */
export const getFile = async (key: string): Promise<string> => {
  const params = {
    Bucket: CONFIG.aws.bucketName,
    Key: key,
  };

  const command = new GetObjectCommand(params);
  const data = await s3Client.send(command);
  return streamToString(data.Body as Readable);
};

/**
 * Delete a file from S3
 */
export const deleteFile = async (key: string): Promise<void> => {
  const params = {
    Bucket: CONFIG.aws.bucketName,
    Key: key,
  };

  await s3Client.send(new DeleteObjectCommand(params));
};
