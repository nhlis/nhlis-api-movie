import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';

import { Notification, NotificationDocument } from './notification.schema';
import { BaseRepository } from '../shared/repositories/base.repository';
import { IdService } from '../shared/services/id.service';
import { EMovieSort, ENotificationType } from '../../common';

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationDocument> {
    private readonly logger = new Logger(NotificationRepository.name);

    constructor(
        @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
        private readonly idService: IdService,
    ) {
        super(notificationModel);
    }

    // ===== WRITE METHODS =====
    public async createNotification(
        payload: {
            profile_id: string;
            type: ENotificationType;
            type_id: string;
        },
        session: ClientSession,
    ): Promise<NotificationDocument> {
        return this.findOneAndUpdate(
            { profile_id: payload.profile_id, type: payload.type, type_id: payload.type_id },
            {
                $setOnInsert: {
                    _id: this.idService.handleGenerateId(),
                    profile_id: payload.profile_id,
                    type: payload.type,
                    type_id: payload.type_id,
                    created_at: new Date(),
                },
            },
            { new: true, upsert: true },
            session,
        );
    }

    // ===== DELETE METHODS =====
    public async deleteNotificationByIdAndProfile(notificationId: string, profile_id: string, session: ClientSession): Promise<{ acknowledged: boolean; deletedCount: number }> {
        return this.deleteDocument({ _id: notificationId, profile_id }, session);
    }

    // ===== READ METHODS =====
    public async findNotifications(limit: number, last_id: string, fields: Array<keyof Notification>, sort: Record<string, SortOrder>): Promise<NotificationDocument[]> {
        const queryBuilder: FilterQuery<History> = {};
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    public async findNotificationsByProfile(profile_id: string, limit: number, last_id: string, fields: Array<keyof Notification>, sort: Record<string, SortOrder>): Promise<NotificationDocument[]> {
        const queryBuilder: FilterQuery<History> = { profile_id };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    // ===== COUNT METHODS =====
    public async countNotificationsByProfile(profile_id: string): Promise<number> {
        return this.countDocuments({ profile_id });
    }
}
