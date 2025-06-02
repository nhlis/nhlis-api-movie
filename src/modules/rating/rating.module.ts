import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OverviewModule } from '../../modules/movies/overview/overview.module';
import { ProfileModule } from '../../modules/profile/profile.module';
import { Rating, RatingSchema } from './rating.schema';
import { RatingController } from './rating.controller';
import { RatingRepository } from './rating.repository';
import { RatingService } from './rating.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }]), ProfileModule, forwardRef(() => OverviewModule)],
    controllers: [RatingController],
    providers: [RatingRepository, RatingService],
    exports: [RatingRepository, RatingService],
})
export class RatingModule {}
