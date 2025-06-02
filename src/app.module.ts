import { Module } from '@nestjs/common';
import * as path from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from './common';
import { SharedModule } from './modules/shared/shared.module';
import { EpisodeModule } from './modules/movies/episode/episode.module';
import { OverviewModule } from './modules/movies/overview/overview.module';
import { SeasonModule } from './modules/movies/season/season.module';
import { BookmarkModule } from './modules/bookmark/bookmark.module';
import { NotificationModule } from './modules/notification/notification.module';
import { CommentModule } from './modules/comment/comment.module';
import { RatingModule } from './modules/rating/rating.module';
import { ReactionModule } from './modules/reaction/reaction.module';
import { HistoryModule } from './modules/history/history.module';
import { SearchHistoryModule } from './modules/search-history/search-history.module';
import { AppController } from './app.controller';
import { ViewModule } from './modules/view/view.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
            load: [() => require(path.resolve(process.cwd(), 'keys.json'))],
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                uri: configService.get<string>('MONGO_URI'),
            }),
        }),
        CacheModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            isGlobal: true,
            useFactory: async (configService: ConfigService) => ({
                store: await redisStore({
                    host: configService.get<string>('REDIS_HOST'),
                    port: configService.get<number>('REDIS_PORT'),
                    auth_pass: configService.get<string>('REDIS_PASS'),
                }),
            }),
        }),
        SharedModule,
        OverviewModule,
        EpisodeModule,
        SeasonModule,
        BookmarkModule,
        NotificationModule,
        SearchHistoryModule,
        CommentModule,
        RatingModule,
        ReactionModule,
        HistoryModule,
        ViewModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
