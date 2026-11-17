import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../auth';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(user: AuthUser) {
    const [draftPages, productsMissingImages, productsMissingSpecs, orders, submissions] = await Promise.all([
      this.prisma.page.count({ where: { status: 'draft' } }),
      this.prisma.product.count({ where: { media: { none: {} }, status: { not: 'archived' } } }),
      this.prisma.product.count({ where: { specifications: { none: {} }, status: { not: 'archived' } } }),
      user.permissions.includes('order:read') ? this.prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }) : Promise.resolve([]),
      user.permissions.includes('submission:read') ? this.prisma.submission.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }) : Promise.resolve([]),
    ]);
    return { data: {
      draftPages,
      productsMissingImages,
      productsMissingSpecs,
      recentOrders: orders.map((row) => ({ id: row.id, reference: row.reference, total: row.total, status: row.orderStatus })),
      recentSubmissions: submissions.map((row) => {
        const name = row.payload && typeof row.payload === 'object' && 'name' in row.payload && typeof row.payload.name === 'string' ? row.payload.name : row.reference;
        return { id: row.id, name, type: row.type, read: row.status !== 'new' };
      }),
    } };
  }
}
