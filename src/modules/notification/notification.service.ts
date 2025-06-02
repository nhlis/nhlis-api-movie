import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { SortOrder } from 'mongoose';

import { NotificationRepository } from './notification.repository';
import { EMovieSort, ENotificationType } from '../../common';
import { NotificationDocument } from './notification.schema';
import { ProfileRepository } from '../profile/profile.repository';
import { CommentRepository } from '../../modules/comment/comment.repository';
import { EpisodeRepository } from '../movies/episode/episode.repository';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        private readonly notificationRepository: NotificationRepository,
        private readonly profileRepository: ProfileRepository,
        private readonly commentRepository: CommentRepository,
        private readonly episodeRepository: EpisodeRepository,
    ) {}

    public async handlePostNotification(profile_id: string, type: ENotificationType, type_id?: string): Promise<NotificationDocument> {
        const profile = await this.profileRepository.findProfileById(profile_id, ['_id'], true);
        if (!profile) throw new NotFoundException({ message: `Profile not found` });

        if (type === ENotificationType.COMMENT && type_id) {
            const comment = await this.commentRepository.findCommentById(type_id, ['_id'], true);
            return this.notificationRepository.createNotification({ profile_id, type, type_id: comment._id }, undefined);
        }
        if (type === ENotificationType.EPISODE && type_id) {
            const episode = await this.episodeRepository.findEpisodeById(type_id, ['_id'], true);
            return this.notificationRepository.createNotification({ profile_id, type, type_id: episode._id }, undefined);
        }
        if (type === ENotificationType.SYSTEM) {
            return this.notificationRepository.createNotification({ profile_id, type, type_id: type_id }, undefined);
        }
    }

    public async handleDeleteNotification(notificationId: string, profile_id: string): Promise<void> {
        const { acknowledged, deletedCount } = await this.notificationRepository.deleteNotificationByIdAndProfile(notificationId, profile_id, undefined);
        if (deletedCount === 0) throw new NotFoundException('Profile or Notification not found');
        if (!acknowledged) throw new InternalServerErrorException('Failed to acknowledge the deletion');
    }

    public async handleGetNotificationsByProfile(profile_id: string, limit: number, last_id: string, release_date: EMovieSort): Promise<NotificationDocument[]> {
        try {
            const sortQuery: { [key: string]: SortOrder } = {
                release_date: Object.values(EMovieSort).includes(release_date) ? release_date : EMovieSort.DESC,
            };

            return this.notificationRepository.findNotificationsByProfile(profile_id, limit, last_id, ['_id', 'profile_id', 'type', 'type_id', 'created_at', 'updated_at'], sortQuery);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Error finding notification');
        }
    }

    public async handleGetNotificationsCountByProfile(profile_id: string): Promise<number> {
        return this.notificationRepository.countDocuments({ profile_id });
    }

    public async handleGetNotifications(limit: number, last_id: string, release_date: EMovieSort): Promise<NotificationDocument[]> {
        try {
            const sortQuery: { [key: string]: SortOrder } = {
                release_date: Object.values(EMovieSort).includes(release_date) ? release_date : EMovieSort.DESC,
            };

            return this.notificationRepository.findNotifications(limit, last_id, ['_id', 'profile_id', 'type', 'type_id', 'created_at', 'updated_at'], sortQuery);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Error finding notification');
        }
    }

    public async handleGetNotificationsCount(): Promise<number> {
        return this.notificationRepository.countDocuments({});
    }
}
