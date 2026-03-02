import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { evidence } from '../db/schema';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET ?? 'orbos-evidence';
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT ?? 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY ?? 'minioadmin',
        secretAccessKey: process.env.R2_SECRET_KEY ?? 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async upload(
    file: { buffer: Buffer; originalname: string; mimetype: string },
    dto: { student_id: string; standard_id: string; phenomenon_id: string; type: 'photo' | 'audio' },
  ) {
    const ext = dto.type === 'photo' ? 'jpg' : 'webm';
    const key = `evidence/${dto.student_id}/${dto.phenomenon_id}/${randomUUID()}.${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const storageUrl = `${this.bucket}/${key}`;

    const [saved] = await db
      .insert(evidence)
      .values({
        studentId: dto.student_id,
        standardId: dto.standard_id,
        phenomenonId: dto.phenomenon_id,
        type: dto.type,
        storageUrl,
      })
      .returning();

    this.logger.log(`Evidence ${saved.id} uploaded: ${storageUrl}`);

    return {
      id: saved.id,
      student_id: saved.studentId,
      standard_id: saved.standardId,
      phenomenon_id: saved.phenomenonId,
      type: saved.type,
      storage_url: saved.storageUrl,
      captured_at: saved.capturedAt.toISOString(),
    };
  }

  async getSignedDownloadUrl(storageUrl: string): Promise<string> {
    const key = storageUrl.replace(`${this.bucket}/`, '');
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 3600 });
  }

  async listByStudent(studentId: string) {
    const rows = await db
      .select()
      .from(evidence)
      .where(eq(evidence.studentId, studentId));

    return rows.map((r) => ({
      id: r.id,
      student_id: r.studentId,
      standard_id: r.standardId,
      phenomenon_id: r.phenomenonId,
      type: r.type,
      storage_url: r.storageUrl,
      captured_at: r.capturedAt.toISOString(),
    }));
  }

  async listByPhenomenon(phenomenonId: string) {
    const rows = await db
      .select()
      .from(evidence)
      .where(eq(evidence.phenomenonId, phenomenonId));

    return rows.map((r) => ({
      id: r.id,
      student_id: r.studentId,
      standard_id: r.standardId,
      phenomenon_id: r.phenomenonId,
      type: r.type,
      storage_url: r.storageUrl,
      captured_at: r.capturedAt.toISOString(),
    }));
  }
}
