import { Module } from '@nestjs/common';
import { VariantsController } from './variants.controller';
import { VariantsRepository } from './variants.repository';
import { VariantsService } from './variants.service';

@Module({ controllers: [VariantsController], providers: [VariantsRepository, VariantsService] })
export class VariantsModule {}
