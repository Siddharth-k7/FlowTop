import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env, MediaStorageDriver } from '../config/env.validation';
import { MediaFilesController } from './media-files.controller';
import { MediaController } from './media.controller';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';
import { LocalObjectStorage } from './storage/local-object-storage';
import { ObjectStorage } from './storage/object-storage';
import { S3ObjectStorage } from './storage/s3-object-storage';

function createStorage(config: ConfigService<Env, true>): ObjectStorage {
  const get = <K extends keyof Env>(key: K) => config.get(key, { infer: true });
  const publicBaseUrl = get('MEDIA_PUBLIC_BASE_URL');

  if (get('MEDIA_STORAGE_DRIVER') === MediaStorageDriver.S3) {
    return new S3ObjectStorage({
      region: get('S3_REGION') ?? '',
      endpoint: get('S3_ENDPOINT'),
      forcePathStyle: get('S3_FORCE_PATH_STYLE'),
      accessKeyId: get('S3_ACCESS_KEY_ID'),
      secretAccessKey: get('S3_SECRET_ACCESS_KEY'),
      publicBucket: get('S3_PUBLIC_BUCKET') ?? '',
      privateBucket: get('S3_PRIVATE_BUCKET') ?? '',
      publicBaseUrl,
    });
  }
  return new LocalObjectStorage({
    rootDir: get('MEDIA_LOCAL_DIR') ?? '',
    publicBaseUrl,
    privateBaseUrl: get('MEDIA_LOCAL_PRIVATE_BASE_URL') ?? '',
    signingKey: Buffer.from(get('MEDIA_URL_SIGNING_KEY') ?? '', 'base64'),
  });
}

@Module({
  controllers: [MediaController, MediaFilesController],
  providers: [
    MediaService,
    MediaRepository,
    { provide: ObjectStorage, useFactory: createStorage, inject: [ConfigService] },
  ],
  exports: [MediaService],
})
export class MediaModule {}
