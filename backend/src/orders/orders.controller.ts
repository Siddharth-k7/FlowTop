import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, CurrentUser, PermissionGuard, RequirePermission } from '../auth';
import type { AuthUser } from '../auth';
import { OrderListQuery, OrderStatusDto, OrdersService } from './orders.service';

@Controller('admin/orders')
@UseGuards(AuthGuard, PermissionGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @RequirePermission('order:read')
  list(@Query() query: OrderListQuery) { return this.orders.list(query); }

  @Get('export')
  @RequirePermission('order:export')
  async export(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) res: Response) {
    const { csv, filename } = await this.orders.export(user.id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
  }

  @Get(':id')
  @RequirePermission('order:read')
  find(@Param('id', ParseUUIDPipe) id: string) { return this.orders.find(id); }

  @Patch(':id/status')
  @RequirePermission('order:status_change')
  status(@Param('id', ParseUUIDPipe) id: string, @Body() dto: OrderStatusDto, @CurrentUser() user: AuthUser) { return this.orders.changeStatus(id, dto, user.id); }
}
