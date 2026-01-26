import { Client } from 'minio';
import NodeClam from 'clamscan';
import { prisma } from '../utils/prisma.js';
import { UserRole, VirusScanStatus } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'donor-oversight';

// ClamAV scanner initialization
let clamscan: any = null;
const initClamAV = async () => {
  if (!clamscan) {
    try {
      clamscan = await new NodeClam().init({
        clamdscan: {
          host: process.env.CLAMAV_HOST || 'localhost',
          port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
        },
      });
    } catch (error) {
      console.error('Failed to initialize ClamAV:', error);
      // Continue without virus scanning if ClamAV is unavailable
    }
  }
  return clamscan;
};

export class AttachmentService {
  async uploadAttachment(
    file: {
      filepath: string;
      originalFilename: string;
      mimetype: string;
      size: number;
    },
    actualId: string,
    uploadedById: string,
    uploadedByRole: UserRole,
    ipAddress?: string
  ) {
    let virusScanStatus: VirusScanStatus = 'Pending';
    let virusScanResult: string | undefined;

    // 1. Scan file with ClamAV (if available)
    const scanner = await initClamAV();
    if (scanner) {
      try {
        const { isInfected, viruses } = await scanner.scanFile(file.filepath);

        if (isInfected) {
          // Delete temp file
          await fs.unlink(file.filepath);
          throw new Error(`File is infected: ${viruses?.join(', ')}`);
        }

        virusScanStatus = 'Clean';
        virusScanResult = 'No threats detected';
      } catch (error: any) {
        if (error.message.includes('infected')) {
          throw error; // Re-throw infection errors
        }
        // If scan fails for other reasons, mark as error but continue
        virusScanStatus = 'Error';
        virusScanResult = error.message;
      }
    } else {
      // No ClamAV available, mark as pending
      virusScanStatus = 'Pending';
      virusScanResult = 'ClamAV not available';
    }

    // 2. Generate storage key
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalFilename || '');
    const storageKey = `attachments/${year}/${month}/${uuid}${ext}`;

    // 3. Ensure bucket exists
    try {
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
      if (!bucketExists) {
        await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      }
    } catch (error) {
      console.error('MinIO bucket check/creation failed:', error);
    }

    // 4. Upload to MinIO
    await minioClient.fPutObject(BUCKET_NAME, storageKey, file.filepath, {
      'Content-Type': file.mimetype,
    });

    // 5. Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        actualId,
        fileName: `${uuid}${ext}`,
        originalFileName: file.originalFilename || 'unknown',
        fileSize: file.size,
        mimeType: file.mimetype,
        storageKey,
        virusScanStatus,
        virusScanResult,
        uploadedById,
      },
    });

    // 6. Delete temp file
    await fs.unlink(file.filepath);

    // 7. Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: uploadedById,
        actorRole: uploadedByRole,
        action: 'Create',
        objectType: 'Attachment',
        objectId: attachment.id,
        newValues: {
          actualId,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
        },
        ipAddress,
      },
    });

    return attachment;
  }

  async getDownloadUrl(attachmentId: string, userId: string): Promise<string> {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId, deletedAt: null },
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    if (attachment.virusScanStatus === 'Infected') {
      throw new Error('Attachment is infected and cannot be downloaded');
    }

    // Generate signed URL (expires in 1 hour)
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      attachment.storageKey,
      3600
    );

    return url;
  }

  async deleteAttachment(
    attachmentId: string,
    deletedById: string,
    deletedByRole: UserRole,
    ipAddress?: string
  ) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId, deletedAt: null },
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Soft delete in database
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date() },
    });

    // Note: Keep file in MinIO for audit trail
    // Could add scheduled cleanup job to delete old files

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: deletedById,
        actorRole: deletedByRole,
        action: 'Delete',
        objectType: 'Attachment',
        objectId: attachmentId,
        ipAddress,
      },
    });

    return { success: true };
  }
}

export const attachmentService = new AttachmentService();
