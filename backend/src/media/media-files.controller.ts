import { Controller, Get, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { ApiException } from '../common/errors/api.exception';
import { MediaBucket } from '../generated/prisma/client';
import { ALLOWED_FILE_TYPES } from './file-types';
import { LocalObjectStorage } from './storage/local-object-storage';
import { ObjectStorage } from './storage/object-storage';

const CONTENT_TYPE_BY_EXTENSION = Object.fromEntries(
  Object.values(ALLOWED_FILE_TYPES).map(({ extension, mimeType }) => [`.${extension}`, mimeType]),
);

/**
 * Serves files for the local storage driver only (development and tests). In
 * staging and production the public bucket is served by the CDN and private
 * files by presigned S3 URLs, and every route here answers 404.
 */
@ApiExcludeController()
@Controller('files')
export class MediaFilesController {
  constructor(private readonly storage: ObjectStorage) {}

  @Get('public/:key')
  async publicFile(@Param('key') key: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const path = await this.localStorage().existingPath(MediaBucket.public, key);
    if (!path) {
      throw notFound();
    }
    setSafeHeaders(res, key, 'public, max-age=31536000, immutable');
    return new StreamableFile(createReadStream(path));
  }

  @Get('private/:key')
  async privateFile(
    @Param('key') key: string,
    @Query('expires') expires: string | undefined,
    @Query('signature') signature: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const storage = this.localStorage();
    if (!storage.verifySignedUrl(key, expires, signature)) {
      throw new ApiException('FORBIDDEN', 'This link has expired or is not valid. Open the file again from the admin.');
    }
    const path = await storage.existingPath(MediaBucket.private, key);
    if (!path) {
      throw notFound();
    }
    setSafeHeaders(res, key, 'private, no-store');
    res.setHeader('Content-Disposition', 'attachment');
    return new StreamableFile(createReadStream(path));
  }

  private localStorage(): LocalObjectStorage {
    if (!(this.storage instanceof LocalObjectStorage)) {
      throw notFound();
    }
    return this.storage;
  }
}

/** The type comes from our own key's extension, and the browser is told not to guess or run anything. */
function setSafeHeaders(res: Response, key: string, cacheControl: string): void {
  res.setHeader('Content-Type', CONTENT_TYPE_BY_EXTENSION[extname(key)] ?? 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('Cache-Control', cacheControl);
}

function notFound(): ApiException {
  return new ApiException('NOT_FOUND', 'File not found.');
}
