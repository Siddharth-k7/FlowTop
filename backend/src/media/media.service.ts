import { Injectable, Logger } from '@nestjs/common';
import { imageSize } from 'image-size';
import { AuditService } from '../audit';
import { pageToSkipTake, paginate, Paginated } from '../common/dto/pagination';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { MediaAsset } from '../generated/prisma/client';
import { ListMediaQuery, MediaAssetResponse, UploadMediaDto } from './dto/media.dto';
import { ALLOWED_FILE_TYPES, BUCKET_FILE_TYPES, detectFileType, displayFilename, looksExecutable } from './file-types';
import { MediaReference, MediaRepository } from './media.repository';
import { newStorageKey, ObjectStorage } from './storage/object-storage';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  size: number;
}

const NOT_FOUND = 'That file does not exist.';
const REFERENCES_LISTED = 5;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly repository: MediaRepository,
    private readonly storage: ObjectStorage,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Every check runs on the bytes in memory, before anything is stored:
   * executable signatures, the real type against the bucket's allow list, and
   * the size limit for that type.
   */
  async upload(file: UploadedFile | undefined, dto: UploadMediaDto, uploadedBy: string): Promise<MediaAssetResponse> {
    if (!file || file.size === 0) {
      throw invalidFile('Choose a file to upload.');
    }
    if (looksExecutable(file.buffer)) {
      this.logger.warn(`Rejected an executable upload by user ${uploadedBy} (named "${displayFilename(file.originalname, 'bin')}")`);
      throw invalidFile('Programs and scripts cannot be uploaded.');
    }

    const mimeType = detectFileType(file.buffer);
    const allowed = BUCKET_FILE_TYPES[dto.bucket];
    if (!mimeType || !allowed.includes(mimeType)) {
      const labels = allowed.map((type) => ALLOWED_FILE_TYPES[type].label).join(', ');
      throw invalidFile(`This file type is not allowed here. Upload one of: ${labels}.`);
    }

    const type = ALLOWED_FILE_TYPES[mimeType];
    if (file.size > type.maxBytes) {
      throw invalidFile(`${type.label} files can be up to ${type.maxBytes / (1024 * 1024)} MB.`);
    }

    const { width, height } = type.kind === 'image' ? dimensionsOf(file.buffer) : { width: null, height: null };
    const storageKey = newStorageKey(type.extension);
    await this.storage.put(dto.bucket, storageKey, file.buffer, mimeType);

    try {
      const asset = await this.repository.create({
        filename: displayFilename(file.originalname, type.extension),
        mimeType,
        sizeBytes: file.size,
        bucket: dto.bucket,
        storageKey,
        width,
        height,
        altText: dto.altText?.trim() ?? '',
        uploadedBy,
      });
      return this.toResponse(asset);
    } catch (error) {
      // Never leave a stored file with no record pointing at it.
      await this.storage.remove(dto.bucket, storageKey).catch(() => undefined);
      throw error;
    }
  }

  async list(query: ListMediaQuery): Promise<Paginated<MediaAssetResponse>> {
    const [rows, total] = await this.repository.list(pageToSkipTake(query), {
      search: query.search?.trim() || undefined,
      kind: query.type,
    });
    return paginate(await Promise.all(rows.map((row) => this.toResponse(row))), total, query);
  }

  async get(id: string): Promise<MediaAssetResponse> {
    const asset = await this.repository.findById(id);
    if (!asset) {
      throw new ApiException('NOT_FOUND', NOT_FOUND);
    }
    return this.toResponse(asset);
  }

  async updateAltText(id: string, altText: string): Promise<MediaAssetResponse> {
    if (!(await this.repository.findById(id))) {
      throw new ApiException('NOT_FOUND', NOT_FOUND);
    }
    return this.toResponse(await this.repository.updateAltText(id, altText.trim()));
  }

  /**
   * 409 naming what still uses the file, so the admin knows where to remove
   * it. The database foreign keys back this up if a reference appears between
   * the check and the delete.
   */
  async remove(id: string, actorId: string): Promise<void> {
    const asset = await this.repository.findById(id);
    const references = asset ? await this.repository.findReferences(id) : null;
    if (!asset || !references) {
      throw new ApiException('NOT_FOUND', NOT_FOUND);
    }
    if (references.length > 0) {
      throw new ApiException('CONFLICT', describeReferences(references));
    }

    await this.prisma.$transaction(async (tx) => {
      await this.repository.delete(id, tx);
      await this.audit.record(
        {
          actorId,
          action: 'delete',
          entityType: 'media_asset',
          entityId: id,
          metadata: { filename: asset.filename, bucket: asset.bucket, mimeType: asset.mimeType },
        },
        tx,
      );
    });

    try {
      await this.storage.remove(asset.bucket, asset.storageKey);
    } catch (error) {
      // The record is gone, so nothing links to the file; it is an orphan to clean up, not a failure to report.
      this.logger.error(`Deleted media ${id} but could not remove its stored file`, error instanceof Error ? error.stack : undefined);
    }
  }

  async toResponse(asset: MediaAsset): Promise<MediaAssetResponse> {
    return {
      id: asset.id,
      url: await this.storage.url(asset.bucket, asset.storageKey),
      alt: asset.altText,
      width: asset.width,
      height: asset.height,
      sizeBytes: asset.sizeBytes,
      mimeType: asset.mimeType,
      variants: readVariants(asset.variants),
    };
  }
}

function invalidFile(message: string): ApiException {
  return new ApiException('VALIDATION_FAILED', message, { file: message });
}

function dimensionsOf(bytes: Buffer): { width: number | null; height: number | null } {
  try {
    const { width, height } = imageSize(bytes);
    return { width: width ?? null, height: height ?? null };
  } catch {
    // Unreadable dimensions do not block the upload; processing (task 2.1) fills them in.
    return { width: null, height: null };
  }
}

function readVariants(value: unknown): MediaAssetResponse['variants'] {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const source = value as Record<string, unknown>;
  const variants: MediaAssetResponse['variants'] = {};
  for (const size of ['thumb', 'medium', 'large'] as const) {
    if (typeof source[size] === 'string') {
      variants[size] = source[size];
    }
  }
  return variants;
}

function describeReferences(references: MediaReference[]): string {
  const listed = references
    .slice(0, REFERENCES_LISTED)
    .map(({ entityType, name, usage }) => `${entityType.replace('_', ' ')} "${name}" (${usage})`);
  const more = references.length > REFERENCES_LISTED ? ` and ${references.length - REFERENCES_LISTED} more` : '';
  return `This file is still in use: ${listed.join('; ')}${more}. Remove it from there first.`;
}
