import { Injectable } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { isSafeLink } from '../common/safe-href';
import { PrismaService } from '../common/prisma/prisma.service';
import { NavigationLinkType, NavigationMenu, Prisma } from '../generated/prisma/client';

const LINK_TYPES = ['page', 'category', 'collection', 'product', 'external'] as const;

/** Root, then two levels of children. Matches NavigationMaxChildDepth in @flowtop/types. */
export const NAVIGATION_MAX_CHILD_DEPTH = 2 as const;

export class NavInput {
  @IsOptional() @IsString() id?: string;
  @IsString() @MaxLength(80) label!: string;
  @IsIn(LINK_TYPES) linkType!: (typeof LINK_TYPES)[number];
  @IsString() @MaxLength(2048) destination!: string;
  @IsOptional() @IsBoolean() openInNewTab?: boolean;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => NavInput) children?: NavInput[];
}

export class ReplaceNavigationDto {
  @ValidateNested({ each: true }) @Type(() => NavInput) header!: NavInput[];
  @ValidateNested({ each: true }) @Type(() => NavInput) footer!: NavInput[];
}

type Node = { id: string; label: string; linkType: NavigationLinkType; destination: string; openInNewTab: boolean; children: Node[] };

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async get() {
    const rows = await this.prisma.navigationItem.findMany({ orderBy: { position: 'asc' } });
    const build = (menu: NavigationMenu, parentId: string | null): Node[] => rows.filter((row) => row.menu === menu && row.parentId === parentId).map((row) => ({
      id: row.id, label: row.label, linkType: row.linkType, destination: row.destination, openInNewTab: row.openInNewTab, children: build(menu, row.id),
    }));
    return { data: { header: build('header', null), footer: build('footer', null) } };
  }

  async replace(dto: ReplaceNavigationDto, actorId: string) {
    await this.assertTree([...(dto.header ?? []), ...(dto.footer ?? [])]);
    const data: Prisma.NavigationItemCreateManyInput[] = [];
    const add = (menu: NavigationMenu, nodes: NavInput[], parentId: string | null) => {
      nodes.forEach((node, index) => {
        const id = node.id && /^[0-9a-f-]{36}$/i.test(node.id) ? node.id : randomUUID();
        data.push({ id, menu, label: node.label.trim(), linkType: node.linkType, destination: node.destination, openInNewTab: node.openInNewTab ?? false, parentId, position: index + 1 });
        add(menu, node.children ?? [], id);
      });
    };
    add('header', dto.header ?? [], null);
    add('footer', dto.footer ?? [], null);
    try {
      await this.prisma.$transaction([
        this.prisma.navigationItem.deleteMany(),
        ...(data.length ? [this.prisma.navigationItem.createMany({ data })] : []),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) throw new ApiException('VALIDATION_FAILED', 'That menu could not be saved.', { destination: 'Check each link.' });
      throw error;
    }
    await this.audit.record({ actorId, action: 'update', entityType: 'navigation', entityId: 'navigation', metadata: { items: data.length } });
    return this.get();
  }

  /** Validates the whole tree before the previous menu is deleted. Depth 2 is a grandchild. */
  private async assertTree(nodes: NavInput[], depth = 0): Promise<void> {
    if (depth > NAVIGATION_MAX_CHILD_DEPTH) {
      if (nodes.length > 0) throw new ApiException('VALIDATION_FAILED', 'A menu only goes three levels deep.', { children: 'Remove items nested under a grandchild.' });
      return;
    }
    for (const node of nodes) {
      if (!node.label?.trim()) throw new ApiException('VALIDATION_FAILED', 'Every menu item needs a label.', { label: 'Every menu item needs a label.' });
      const external = isSafeLink(node.destination, false);
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(node.destination);
      if (node.linkType === 'external' ? !external : !uuid) {
        throw new ApiException('VALIDATION_FAILED', 'Use a page, category, collection or product id, or an https, mailto or tel link.', { destination: 'That destination is not allowed.' });
      }
      if (node.linkType !== 'external' && !(await this.destinationExists(node.linkType, node.destination))) {
        throw new ApiException('VALIDATION_FAILED', 'That page, category, collection or product does not exist.', { destination: 'That destination does not exist.' });
      }
      await this.assertTree(node.children ?? [], depth + 1);
    }
  }

  private async destinationExists(linkType: NavInput['linkType'], id: string): Promise<boolean> {
    const where = { where: { id }, select: { id: true } };
    if (linkType === 'page') return (await this.prisma.page.findUnique(where)) !== null;
    if (linkType === 'category') return (await this.prisma.category.findUnique(where)) !== null;
    if (linkType === 'collection') return (await this.prisma.collection.findUnique(where)) !== null;
    if (linkType === 'product') return (await this.prisma.product.findUnique(where)) !== null;
    return false;
  }
}
