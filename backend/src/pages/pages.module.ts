import { Module } from '@nestjs/common';
import { PublishStateService } from '../_base/publish-state.service';
import { SlugService } from '../_base/slug.service';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({ controllers: [PagesController], providers: [PagesService, SlugService, PublishStateService] })
export class PagesModule {}
