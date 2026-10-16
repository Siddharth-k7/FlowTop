import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

// products.repository.ts: the only place Prisma is called. Takes the tx client.
@Injectable()
export class ProductsPublishRepository {
  constructor(private readonly prisma: PrismaService) {}

  async publish(id: string, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    await tx.product.update({ where: { id }, data: { status: 'published', publishedAt: new Date() } });
  }
}

// products.service.ts: owns the transaction, so the audit row commits or rolls back with the change.
@Injectable()
export class ProductsPublishService {
  constructor(
    private readonly repository: ProductsPublishRepository,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async publish(actorId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.repository.publish(id, tx);
      await this.audit.record({ actorId, action: 'publish', entityType: 'product', entityId: id }, tx);
    });
  }
}
