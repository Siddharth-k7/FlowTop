import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { PublishStateService } from '../_base/publish-state.service';

@Module({ controllers: [ProductsController], providers: [ProductsRepository, ProductsService, PublishStateService] })
export class ProductsModule {}
