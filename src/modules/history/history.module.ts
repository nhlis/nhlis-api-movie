import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { History, HistorySchema } from './history.schema';
import { HistoryController } from './history.controller';
import { HistoryRepository } from './history.repository';
import { HistoryService } from './history.service';
import { EpisodeModule } from '../movies/episode/episode.module';
import { OverviewModule } from '../../modules/movies/overview/overview.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: History.name, schema: HistorySchema }]), EpisodeModule, OverviewModule],
    controllers: [HistoryController],
    providers: [HistoryRepository, HistoryService],
    exports: [HistoryRepository, HistoryService],
})
export class HistoryModule {}
