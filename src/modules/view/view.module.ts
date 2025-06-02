import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EpisodeModule } from '../movies/episode/episode.module';
import { OverviewModule } from '../movies/overview/overview.module';
import { ViewController } from './view.controller';
import { ViewRepository } from './view.repository';
import { ViewService } from './view.service';
import { View, ViewSchema } from './view.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: View.name, schema: ViewSchema }]), EpisodeModule, OverviewModule],
    controllers: [ViewController],
    providers: [ViewRepository, ViewService],
    exports: [ViewRepository, ViewService],
})
export class ViewModule {}
