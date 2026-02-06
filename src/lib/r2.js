import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Initialize the S3 client for Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generates a pre-signed URL for uploading a file directly to R2.
 * @param {string} key - The file path/name in the bucket (e.g., 'users/123/avatar.png')
 * @param {string} contentType - The MIME type of the file
 * @returns {Promise<{url: string, key: string}>}
 */
export async function getUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  return { url, key };
}

/**
 * Deletes a file from R2.
 * @param {string} key - The file path/name in the bucket
 */
export async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  
  await r2Client.send(command);
}

/**
 * Constructs the public URL for a file (assuming a public custom domain is set up, 
 * or using the worker/public bucket URL if enabled).
 * @param {string} key 
 * @returns {string}
 */
export function getPublicUrl(key) {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain) {
    // Fallback or warning if no public domain is configured
    console.warn('R2_PUBLIC_DOMAIN is not set. Returning raw key.');
    return key;
  }
  return `${publicDomain}/${key}`;
}
