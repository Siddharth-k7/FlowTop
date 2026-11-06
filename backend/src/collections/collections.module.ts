import { Module } from '@nestjs/common';
import { SlugService } from '../_base/slug.service';
import { CollectionsController } from './collections.controller';
import { CollectionsRepository } from './collections.repository';
import { CollectionsService } from './collections.service';

@Module({ controllers: [CollectionsController], providers: [CollectionsRepository, CollectionsService, SlugService] })
export class CollectionsModule {}
