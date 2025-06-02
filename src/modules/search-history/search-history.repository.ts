import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';

import { BaseRepository } from '../shared/repositories/base.repository';
import { IdService } from '../shared/services/id.service';
import { SearchHistory, SearchHistoryDocument } from './search-history.schema';

@Injectable()
export class SearchHistoryRepository extends BaseRepository<SearchHistoryDocument> {
    private readonly logger = new Logger(SearchHistoryRepository.name);

    constructor(
        @InjectModel(SearchHistory.name) private readonly searchHistoryModel: Model<SearchHistoryDocument>,
        private readonly idService: IdService,
    ) {
        super(searchHistoryModel);
    }

    // ===== WRITE METHODS =====
    public async createSearchHistory(payload: { profile_id: string; overview_id: string }, session?: ClientSession): Promise<SearchHistoryDocument> {
        return this.findOneAndUpdate(
            { profile_id: payload.profile_id, overview_id: payload.overview_id },
            {
                $setOnInsert: { _id: this.idService.handleGenerateId(), profile_id: payload.profile_id, overview_id: payload.overview_id },
                $set: { created_at: new Date() },
            },
            { new: true, upsert: true },
            session,
        );
    }

    // ===== DELETE METHODS =====
    public async deleteSearchHistoriesByProfileAndOverviewIds(profile_id: string, overview_ids: string[], session: ClientSession): Promise<{ acknowledged: boolean; deletedCount: number }> {
        return this.searchHistoryModel.deleteMany({ profile_id, overview_id: { $in: overview_ids } }, session);
    }

    // ===== READ METHODS =====
    public async findSearchHistories(
        query: FilterQuery<History>,
        limit: number,
        last_id: string,
        fields: Array<keyof SearchHistory>,
        sort: Record<string, SortOrder>,
    ): Promise<SearchHistoryDocument[]> {
        return this.findDocuments(query, limit, fields, sort, true);
    }

    // ===== COUNT METHODS =====
    public async countSearchHistoriesByProfile(profile_id: string): Promise<number> {
        return this.countDocuments({ profile_id });
    }
}
