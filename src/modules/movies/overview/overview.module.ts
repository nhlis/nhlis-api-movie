import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OverviewService } from './overview.service';
import { OverviewRepository } from './overview.repository';
import { OverviewController } from './overview.controller';
import { Overview, OverviewSchema } from './overview.schema';
import { RatingModule } from '../../../modules/rating/rating.module';
import { BookmarkModule } from '../../../modules/bookmark/bookmark.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Overview.name, schema: OverviewSchema }]), BookmarkModule, RatingModule],
    controllers: [OverviewController],
    providers: [OverviewRepository, OverviewService],
    exports: [OverviewRepository, OverviewService],
})
export class OverviewModule {}
