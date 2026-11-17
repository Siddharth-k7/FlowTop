import { Module } from '@nestjs/common';
import { PublishStateService } from '../_base/publish-state.service';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';
import { SpecificationsService } from './specifications.service';
import { VariantsController } from './variants.controller';
import { VariantsService } from './variants.service';

@Module({
  controllers: [ProductsController, VariantsController],
  providers: [ProductsRepository, ProductsService, PublishStateService, VariantsService, SpecificationsService],
})
export class ProductsModule {}
