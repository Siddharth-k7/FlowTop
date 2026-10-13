import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MediaBucket } from '../../generated/prisma/client';
import { ObjectStorage, PRIVATE_URL_TTL_SECONDS, publicUrl } from './object-storage';

export interface S3StorageOptions {
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicBucket: string;
  privateBucket: string;
  publicBaseUrl: string;
}

/**
 * Staging and production storage on any S3-compatible service. The two
 * buckets are separate, so a mistake in one never exposes the other. The
 * private bucket must block all public access; its files are only ever
 * handed out as presigned URLs that expire after 15 minutes.
 */
export class S3ObjectStorage extends ObjectStorage {
  private readonly client: S3Client;
  private readonly buckets: Record<MediaBucket, string>;

  constructor(private readonly options: S3StorageOptions) {
    super();
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      credentials:
        options.accessKeyId && options.secretAccessKey
          ? { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey }
          : undefined,
    });
    this.buckets = { public: options.publicBucket, private: options.privateBucket };
  }

  async put(bucket: MediaBucket, key: string, body: Buffer, contentType: string): Promise<void> {
    const isPublic = bucket === MediaBucket.public;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.buckets[bucket],
        Key: key,
        Body: body,
        ContentType: contentType,
        // Keys are never reused, so public files can be cached forever.
        CacheControl: isPublic ? 'public, max-age=31536000, immutable' : 'private, no-store',
        ContentDisposition: isPublic ? undefined : 'attachment',
      }),
    );
  }

  async remove(bucket: MediaBucket, key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
  }

  url(bucket: MediaBucket, key: string): Promise<string> {
    if (bucket === MediaBucket.public) {
      return Promise.resolve(publicUrl(this.options.publicBaseUrl, key));
    }
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.buckets.private, Key: key, ResponseContentDisposition: 'attachment' }),
      { expiresIn: PRIVATE_URL_TTL_SECONDS },
    );
  }
}
