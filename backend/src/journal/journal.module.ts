import { Module } from '@nestjs/common';
import { PublishStateService } from '../_base/publish-state.service';
import { SlugService } from '../_base/slug.service';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({ controllers: [JournalController], providers: [JournalService, SlugService, PublishStateService] })
export class JournalModule {}
