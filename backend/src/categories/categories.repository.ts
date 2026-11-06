import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] });
  }

  find(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  slugTaken(slug: string, excludeId?: string) {
    return this.prisma.category.count({ where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } }).then((n) => n > 0);
  }

  count() {
    return this.prisma.category.count();
  }

  productCount(id: string) {
    return this.prisma.product.count({ where: { categoryId: id } });
  }

  create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, index) => this.prisma.category.update({ where: { id }, data: { position: index + 1 } })));
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
