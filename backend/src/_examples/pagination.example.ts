import { Controller, Get, Injectable, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { AuthGuard, PermissionGuard, RequirePermission } from '../auth';
import { pageToSkipTake, paginate, PaginationQueryDto } from '../common/dto/pagination';
import type { Paginated } from '../common/dto/pagination';
import { PrismaService } from '../common/prisma/prisma.service';
import { Product } from '../generated/prisma/client';

export class ProductListQuery extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

// DEV B: placeholder for the contract's ProductCard and your mapping to it.
export interface ProductCard {
  id: string;
  name: string;
  sku: string;
}
const toProductCard = (product: Product): ProductCard => ({ id: product.id, name: product.name, sku: product.sku });

@Injectable()
export class ProductsListRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(page: { skip: number; take: number }, search?: string): Promise<[Product[], number]> {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    return this.prisma.$transaction([
      this.prisma.product.findMany({ where, orderBy: { name: 'asc' }, ...page }),
      this.prisma.product.count({ where }),
    ]);
  }
}

@Injectable()
export class ProductsListService {
  constructor(private readonly repository: ProductsListRepository) {}

  async list(query: ProductListQuery): Promise<Paginated<ProductCard>> {
    const [rows, total] = await this.repository.list(pageToSkipTake(query), query.search);
    return paginate(rows.map(toProductCard), total, query);
  }
}

@Controller('admin/products')
export class ProductsListController {
  constructor(private readonly products: ProductsListService) {}

  @Get()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermission('product:read')
  list(@Query() query: ProductListQuery): Promise<Paginated<ProductCard>> {
    return this.products.list(query);
  }
}
