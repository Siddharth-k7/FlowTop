import { Injectable } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AuditService } from '../audit/audit.service';
import { paginate, PaginationQueryDto } from '../common/dto/pagination';
import { ApiException } from '../common/errors/api.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrderStatus, Prisma } from '../generated/prisma/client';
import { toCsv } from './csv';

const STATUSES = ['received', 'confirmed', 'shipped', 'cancelled'] as const;
const PAYMENTS = ['pending', 'paid', 'failed', 'refunded'] as const;
const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  received: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
};

export class OrderListQuery extends PaginationQueryDto {
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
  @IsOptional() @IsIn(PAYMENTS) paymentStatus?: (typeof PAYMENTS)[number];
  @IsOptional() @IsString() @MaxLength(200) search?: string;
}

export class OrderStatusDto {
  @IsIn(STATUSES) status!: (typeof STATUSES)[number];
  @IsString() @MaxLength(500) note!: string;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private where(query: OrderListQuery): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.orderStatus = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.search) where.OR = [
      { reference: { contains: query.search, mode: 'insensitive' } },
      { customerName: { contains: query.search, mode: 'insensitive' } },
      { customerEmail: { contains: query.search, mode: 'insensitive' } },
    ];
    return where;
  }

  private summary(row: { id: string; reference: string; customerName: string; customerEmail: string; total: number; paymentStatus: string; orderStatus: string; createdAt: Date }) {
    return { id: row.id, reference: row.reference, customerName: row.customerName, customerEmail: row.customerEmail, total: row.total, paymentStatus: row.paymentStatus, status: row.orderStatus, createdAt: row.createdAt.toISOString() };
  }

  async list(query: OrderListQuery) {
    const where = this.where(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.perPage, take: query.perPage }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(rows.map((row) => this.summary(row)), total, query);
  }

  async find(id: string) {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: { orderBy: { createdAt: 'asc' } } } });
    if (!row) throw new ApiException('NOT_FOUND', 'Order not found');
    const events = await this.prisma.auditEvent.findMany({ where: { entityType: 'order', entityId: id }, orderBy: { createdAt: 'asc' }, include: { actor: { select: { name: true } } } });
    return { data: {
      ...this.summary(row),
      customerPhone: row.customerPhone,
      delivery: { line1: row.deliveryAddressLine1, line2: row.deliveryAddressLine2, city: row.deliveryCity, state: row.deliveryState, pin: row.deliveryPin, landmark: row.deliveryLandmark, notes: row.deliveryNotes },
      subtotal: row.subtotal, shipping: row.shipping, tax: row.tax,
      items: row.items.map((item) => ({ id: item.id, name: item.productName, sku: item.sku, finish: item.variantName, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal })),
      timeline: events.map((event) => ({ at: event.createdAt.toISOString(), status: String((event.metadata as { status?: string } | null)?.status ?? row.orderStatus), note: String((event.metadata as { note?: string } | null)?.note ?? ''), by: event.actor?.name ?? 'System' })),
    } };
  }

  async changeStatus(id: string, dto: OrderStatusDto, actorId: string) {
    const row = await this.prisma.order.findUnique({ where: { id } });
    if (!row) throw new ApiException('NOT_FOUND', 'Order not found');
    if (!dto.note.trim()) throw new ApiException('VALIDATION_FAILED', 'Say why the status is changing.', { note: 'Say why the status is changing.' });
    if (!NEXT[row.orderStatus].includes(dto.status)) throw new ApiException('VALIDATION_FAILED', 'That status change is not allowed.', { status: `${row.orderStatus} cannot move to ${dto.status}.` });
    await this.prisma.order.update({ where: { id }, data: { orderStatus: dto.status } });
    await this.audit.record({ actorId, action: 'status_change', entityType: 'order', entityId: id, metadata: { status: dto.status, note: dto.note.trim() } });
    return this.find(id);
  }

  async export(actorId: string) {
    const rows = await this.prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
    await this.audit.record({ actorId, action: 'export', entityType: 'order', entityId: 'orders', metadata: { rows: rows.length } });
    const header = ['reference', 'customerName', 'customerEmail', 'total', 'status', 'paymentStatus', 'createdAt'];
    const csv = toCsv(header, rows.map((row) => [row.reference, row.customerName, row.customerEmail, row.total, row.orderStatus, row.paymentStatus, row.createdAt.toISOString()]));
    const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    return { csv, filename };
  }
}
