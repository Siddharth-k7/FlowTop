import { Module } from '@nestjs/common';
import { PlacementsController } from './placements.controller';
import { PlacementsRepository } from './placements.repository';
import { PlacementsService } from './placements.service';

@Module({ controllers: [PlacementsController], providers: [PlacementsRepository, PlacementsService] })
export class PlacementsModule {}
