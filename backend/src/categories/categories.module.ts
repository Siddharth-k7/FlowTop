import { Module } from '@nestjs/common';
import { SlugService } from '../_base/slug.service';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesRepository, CategoriesService, SlugService],
  exports: [CategoriesRepository],
})
export class CategoriesModule {}
