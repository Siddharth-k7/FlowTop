import { Injectable } from '@nestjs/common';
import { requireRecordAccess } from '../auth';
import type { AuthUser } from '../auth';
import { PrismaService } from '../common/prisma/prisma.service';
import { MediaAsset } from '../generated/prisma/client';

@Injectable()
export class MediaUploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<MediaAsset | null> {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }
}

// A product manager may remove media they uploaded themselves; media:delete may remove anyone's.
@Injectable()
export class MediaUploadsService {
  constructor(private readonly repository: MediaUploadsRepository) {}

  async findRemovable(viewer: AuthUser, id: string): Promise<MediaAsset> {
    return requireRecordAccess(viewer, await this.repository.findById(id), {
      allWith: ['media:delete'], // these permissions reach every record
      ownedBy: (user, asset) => asset.uploadedBy === user.id, // everyone else: only their own
    });
  }
}
