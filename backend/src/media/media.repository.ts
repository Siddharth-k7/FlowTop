import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MediaAsset, MediaBucket, Prisma } from '../generated/prisma/client';
import { FileKind } from './file-types';

export interface NewMediaAsset {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  bucket: MediaBucket;
  storageKey: string;
  width: number | null;
  height: number | null;
  altText: string;
  uploadedBy: string;
}

export interface MediaListFilter {
  search?: string;
  kind?: FileKind;
}

/** Something that still points at a media asset, named for a human. */
export interface MediaReference {
  entityType: 'product' | 'variant' | 'category' | 'collection' | 'page' | 'journal_article';
  id: string;
  name: string;
  usage: string;
}

const PER_RELATION = 6;
const NAMED = { take: PER_RELATION, select: { id: true, name: true } } as const;
const TITLED = { take: PER_RELATION, select: { id: true, title: true } } as const;

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewMediaAsset): Promise<MediaAsset> {
    return this.prisma.mediaAsset.create({ data });
  }

  findById(id: string): Promise<MediaAsset | null> {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }

  async list(page: { skip: number; take: number }, filter: MediaListFilter): Promise<[MediaAsset[], number]> {
    const where = toWhere(filter);
    return this.prisma.$transaction([
      this.prisma.mediaAsset.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], ...page }),
      this.prisma.mediaAsset.count({ where }),
    ]);
  }

  updateAltText(id: string, altText: string): Promise<MediaAsset> {
    return this.prisma.mediaAsset.update({ where: { id }, data: { altText } });
  }

  /** Everything that still uses the asset, or null if the asset does not exist. */
  async findReferences(id: string): Promise<MediaReference[] | null> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id },
      select: {
        productMedia: { take: PER_RELATION, select: { role: true, product: { select: { id: true, name: true } } } },
        productDocuments: { take: PER_RELATION, select: { name: true, product: { select: { id: true, name: true } } } },
        variantImages: { take: PER_RELATION, select: { id: true, name: true, product: { select: { name: true } } } },
        productSeoImages: NAMED,
        categoryImages: NAMED,
        categorySeoImages: NAMED,
        collectionImages: NAMED,
        collectionHeroMedia: NAMED,
        collectionSeoImages: NAMED,
        pageSeoImages: TITLED,
        articleHeroImages: TITLED,
        articleSeoImages: TITLED,
      },
    });
    if (!asset) {
      return null;
    }

    const named = (entityType: MediaReference['entityType'], usage: string) => (row: { id: string; name: string }) => ({
      entityType,
      id: row.id,
      name: row.name,
      usage,
    });
    const titled = (entityType: MediaReference['entityType'], usage: string) => (row: { id: string; title: string }) => ({
      entityType,
      id: row.id,
      name: row.title,
      usage,
    });

    return [
      ...asset.productMedia.map(({ role, product }) => ({
        entityType: 'product' as const,
        id: product.id,
        name: product.name,
        usage: role === 'primary' ? 'main image' : 'gallery image',
      })),
      ...asset.productDocuments.map(({ name, product }) => ({
        entityType: 'product' as const,
        id: product.id,
        name: product.name,
        usage: `document "${name}"`,
      })),
      ...asset.variantImages.map(({ id: variantId, name, product }) => ({
        entityType: 'variant' as const,
        id: variantId,
        name: `${product.name}, ${name}`,
        usage: 'finish image',
      })),
      ...asset.productSeoImages.map(named('product', 'share image')),
      ...asset.categoryImages.map(named('category', 'image')),
      ...asset.categorySeoImages.map(named('category', 'share image')),
      ...asset.collectionImages.map(named('collection', 'image')),
      ...asset.collectionHeroMedia.map(named('collection', 'hero')),
      ...asset.collectionSeoImages.map(named('collection', 'share image')),
      ...asset.pageSeoImages.map(titled('page', 'share image')),
      ...asset.articleHeroImages.map(titled('journal_article', 'hero image')),
      ...asset.articleSeoImages.map(titled('journal_article', 'share image')),
    ];
  }

  /** Pass the transaction client so the delete commits or rolls back with its audit row. */
  async delete(id: string, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    await tx.mediaAsset.delete({ where: { id } });
  }
}

function toWhere({ search, kind }: MediaListFilter): Prisma.MediaAssetWhereInput {
  return {
    ...(search
      ? {
          OR: [
            { filename: { contains: search, mode: 'insensitive' } },
            { altText: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(kind === 'image' ? { mimeType: { startsWith: 'image/' } } : {}),
    ...(kind === 'document' ? { mimeType: 'application/pdf' } : {}),
  };
}
