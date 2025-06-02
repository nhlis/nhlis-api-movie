import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SearchHistoryController } from './search-history.controller';
import { SearchHistoryRepository } from './search-history.repository';
import { SearchHistoryService } from './search-history.service';
import { SearchHistory, SearchHistorySchema } from './search-history.schema';
import { OverviewModule } from '../movies/overview/overview.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: SearchHistory.name, schema: SearchHistorySchema }]), OverviewModule, ProfileModule],
    controllers: [SearchHistoryController],
    providers: [SearchHistoryRepository, SearchHistoryService],
    exports: [SearchHistoryRepository, SearchHistoryService],
})
export class SearchHistoryModule {}
