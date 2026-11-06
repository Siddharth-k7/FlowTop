import { Injectable } from '@nestjs/common';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { NavigationLinkType, NavigationMenu, Prisma } from '../generated/prisma/client';

const LINK_TYPES = ['page', 'category', 'collection', 'product', 'external'] as const;

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
    const data: Prisma.NavigationItemCreateManyInput[] = [];
    const add = (menu: NavigationMenu, nodes: NavInput[], parentId: string | null) => {
      nodes.forEach((node, index) => {
        if (!node.label.trim()) throw new ApiException('VALIDATION_FAILED', 'Every menu item needs a label.', { label: 'Every menu item needs a label.' });
        if (node.linkType !== 'external' && !/^[0-9a-f-]{36}$/i.test(node.destination)) {
          throw new ApiException('VALIDATION_FAILED', 'Choose a page, category, collection or product.', { destination: 'That destination is not an id.' });
        }
        const id = node.id && /^[0-9a-f-]{36}$/i.test(node.id) ? node.id : randomUUID();
        data.push({ id, menu, label: node.label.trim(), linkType: node.linkType, destination: node.destination, openInNewTab: node.openInNewTab ?? false, parentId, position: index + 1 });
        if (parentId === null) add(menu, node.children ?? [], id);
      });
    };
    add('header', dto.header ?? [], null);
    add('footer', dto.footer ?? [], null);
    await this.prisma.$transaction([
      this.prisma.navigationItem.deleteMany(),
      ...(data.length ? [this.prisma.navigationItem.createMany({ data })] : []),
    ]);
    await this.audit.record({ actorId, action: 'update', entityType: 'navigation', entityId: 'navigation', metadata: { items: data.length } });
    return this.get();
  }
}
