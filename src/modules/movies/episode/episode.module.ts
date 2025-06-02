import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Episode, EpisodeSchema } from './episode.schema';
import { EpisodeController } from './episode.controller';
import { EpisodeService } from './episode.service';
import { EpisodeRepository } from './episode.repository';
import { EpisodeProcessor } from './episode.processor';
import { SeasonModule } from '../season/season.module';
import { ProfileModule } from '../../profile/profile.module';
import { OverviewModule } from '../overview/overview.module';
import { ReactionModule } from '../../../modules/reaction/reaction.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Episode.name, schema: EpisodeSchema }]), SeasonModule, ProfileModule, OverviewModule, forwardRef(() => ReactionModule)],
    controllers: [EpisodeController],
    providers: [EpisodeRepository, EpisodeService, EpisodeProcessor],
    exports: [EpisodeRepository, EpisodeService, EpisodeProcessor],
})
export class EpisodeModule {}
