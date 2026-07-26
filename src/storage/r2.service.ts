import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// R2 is S3-compatible, so the AWS SDK works unchanged — only the endpoint
// and credentials point at Cloudflare instead of AWS. Videos are served back
// via a public bucket URL (no re-signing needed for playback); uploads use a
// short-lived presigned PUT so video bytes never pass through this server.
@Injectable()
export class R2Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME') ?? '';
    this.publicBaseUrl = (this.config.get<string>('R2_PUBLIC_BASE_URL') ?? '').replace(/\/$/, '');

    const endpoint = this.config.get<string>('R2_ENDPOINT') || `https://${accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: accessKeyId ?? '',
        secretAccessKey: secretAccessKey ?? '',
      },
    });
  }

  private assertConfigured() {
    if (!this.bucket || !this.publicBaseUrl) {
      throw new InternalServerErrorException('R2 storage is not configured on the server (missing bucket/public URL).');
    }
  }

  buildExerciseVideoKey(exerciseId: string, contentType: string) {
    const extension = contentType.split('/')[1]?.replace('quicktime', 'mov') || 'mp4';
    return `exercises/${exerciseId}/${randomUUID()}.${extension}`;
  }

  publicUrlFor(key: string) {
    return `${this.publicBaseUrl}/${key}`;
  }

  async getUploadUrl(key: string, contentType: string): Promise<string> {
    this.assertConfigured();
    try {
      const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
      return await getSignedUrl(this.client, command, { expiresIn: 600 });
    } catch {
      throw new InternalServerErrorException('Could not create an R2 upload URL. Check R2 credentials/bucket configuration.');
    }
  }

  async deleteObject(key: string): Promise<void> {
    this.assertConfigured();
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      throw new InternalServerErrorException('Could not delete the object from R2.');
    }
  }

  keyFromPublicUrl(url: string): string | null {
    if (!this.publicBaseUrl || !url.startsWith(`${this.publicBaseUrl}/`)) return null;
    return url.slice(this.publicBaseUrl.length + 1);
  }
}
