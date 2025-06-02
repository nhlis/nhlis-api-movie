import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SeasonRepository } from './season.repository';
import { Season, SeasonSchema } from './season.schema';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { OverviewModule } from '../overview/overview.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Season.name, schema: SeasonSchema }]), OverviewModule],
    controllers: [SeasonController],
    providers: [SeasonRepository, SeasonService],
    exports: [SeasonRepository, SeasonService],
})
export class SeasonModule {}
