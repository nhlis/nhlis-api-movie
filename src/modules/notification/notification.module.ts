import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Notification, NotificationSchema } from './notification.schema';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ProfileModule } from '../profile/profile.module';
import { CommentModule } from '../../modules/comment/comment.module';
import { EpisodeModule } from '../movies/episode/episode.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]), ProfileModule, CommentModule, EpisodeModule],
    controllers: [NotificationController],
    providers: [NotificationService, NotificationRepository],
    exports: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
