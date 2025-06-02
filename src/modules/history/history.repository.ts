import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';
import { History, HistoryDocument } from './history.schema';
import { BaseRepository } from '../shared/repositories/base.repository';
import { IdService } from '../shared/services/id.service';

@Injectable()
export class HistoryRepository extends BaseRepository<HistoryDocument> {
    private readonly logger = new Logger(HistoryRepository.name);

    constructor(
        @InjectModel(History.name) private readonly historyModel: Model<HistoryDocument>,
        private readonly idService: IdService,
    ) {
        super(historyModel);
    }

    // ===== WRITE METHODS =====
    public async ensureHistory(payload: { profile_id: string; overview_id: string; episode_id: string }, session?: ClientSession): Promise<Partial<HistoryDocument>> {
        return this.findOneAndUpdate(
            {
                profile_id: payload.profile_id,
                overview_id: payload.overview_id,
                episode_id: payload.episode_id,
            },
            {
                $setOnInsert: {
                    _id: this.idService.handleGenerateId(),
                    profile_id: payload.profile_id,
                    overview_id: payload.overview_id,
                    episode_id: payload.episode_id,
                },
                $set: { updated_at: new Date() },
            },
            { new: true, upsert: true },
            session,
        );
    }
    public async deleteHistory(payload: { _id: string; profile_id: string }): Promise<{ acknowledged: boolean; deletedCount: number }> {
        return this.deleteDocument({ _id: payload._id, profile_id: payload.profile_id });
    }

    public async deleteHistories(profile_id: string): Promise<{ acknowledged: boolean; deletedCount: number }> {
        return this.historyModel.deleteMany({ profile_id });
    }

    // ===== READ METHODS =====

    public async findHistory(query: FilterQuery<History>, fields: Array<keyof History>, lean: boolean): Promise<Partial<HistoryDocument>> {
        return this.findDocument(query, fields, true);
    }

    public async findHistories(query: FilterQuery<History>, limit: number, fields: Array<keyof History>, sort: Record<string, SortOrder>): Promise<Partial<HistoryDocument>[]> {
        return this.findDocuments(query, limit, fields, sort, true);
    }
}
