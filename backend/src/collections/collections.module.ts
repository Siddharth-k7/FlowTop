import { Module } from '@nestjs/common';
import { PublishStateService } from '../_base/publish-state.service';
import { SlugService } from '../_base/slug.service';
import { CollectionsController } from './collections.controller';
import { CollectionsRepository } from './collections.repository';
import { CollectionsService } from './collections.service';

@Module({ controllers: [CollectionsController], providers: [CollectionsRepository, CollectionsService, SlugService, PublishStateService] })
export class CollectionsModule {}
