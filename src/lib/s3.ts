import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const bucket = process.env.AWS_S3_BUCKET || '';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

// In AWS, prefer the EC2 instance profile credential chain. Static credentials
// remain available for local development when both values are supplied.
export const isS3Configured = Boolean(bucket);

const s3Client: S3Client | null = isS3Configured
  ? new S3Client({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    })
  : null;

/**
 * Uploads a buffer either to Amazon S3 (if configured) or to the local public/uploads directory.
 */
export async function uploadFileBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueKey = `passports/${Date.now()}_${sanitizedName}`;

  if (isS3Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: uniqueKey,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return `https://${bucket}.s3.${region}.amazonaws.com/${uniqueKey}`;
  }

  // Local fallback storage in public/uploads/
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, sanitizedName);
  fs.writeFileSync(localFilePath, buffer);
  return `/uploads/${sanitizedName}`;
}

/**
 * Generates an S3 presigned URL for direct browser uploads.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; fileUrl: string }> {
  if (!isS3Configured || !s3Client) {
    throw new Error('S3 is not configured. Use the /api/upload endpoint for local uploads.');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl };
}
