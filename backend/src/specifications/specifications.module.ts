import { Module } from '@nestjs/common';
import { SpecificationsController } from './specifications.controller';
import { SpecificationsRepository } from './specifications.repository';
import { SpecificationsService } from './specifications.service';

@Module({ controllers: [SpecificationsController], providers: [SpecificationsRepository, SpecificationsService] })
export class SpecificationsModule {}
