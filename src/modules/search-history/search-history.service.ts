import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SearchHistoryRepository } from './search-history.repository';
import { SearchHistoryDocument } from './search-history.schema';
import { OverviewRepository } from '../movies/overview/overview.repository';
import { ProfileRepository } from '../profile/profile.repository';
import { FilterQuery } from 'mongoose';
import { IResponeSeachHistory } from '../../common';

@Injectable()
export class SearchHistoryService {
    constructor(
        private readonly searchHistoryRepository: SearchHistoryRepository,
        private readonly profileRepository: ProfileRepository,
        private readonly overviewRepository: OverviewRepository,
    ) {}

    public async handlePostSearchHistory(payload: { profile_id: string; overview_id: string }): Promise<SearchHistoryDocument> {
        const [overview, profile] = await Promise.all([
            this.overviewRepository.findOverviewById(payload.overview_id, ['_id'], true),
            this.profileRepository.findProfileById(payload.profile_id, ['_id'], true),
        ]);
        if (!overview) throw new NotFoundException({ message: 'Overview not found' });
        if (!profile) throw new NotFoundException({ message: 'Profile not found' });
        return this.searchHistoryRepository.createSearchHistory({ profile_id: payload.profile_id, overview_id: payload.overview_id });
    }

    public async handleGetSearchHistories(profile_id: string, limit: number, last_id: string): Promise<{ search_histories: IResponeSeachHistory[]; hasMore: boolean }> {
        const query: FilterQuery<History> = {};
        if (last_id) query._id = { $gt: last_id };
        if (profile_id) query.profile_id = profile_id;

        const limitPlusOne = limit + 1;

        const search_historys = await this.searchHistoryRepository.findSearchHistories(query, limit, last_id, ['_id', 'profile_id', 'overview_id', 'created_at', 'updated_at'], { created_at: -1 });

        const hasMore = search_historys.length === limitPlusOne;

        const trimmedSearchHistories = hasMore ? search_historys.slice(0, limit) : search_historys;

        const overviewIds = trimmedSearchHistories.map((o) => o.overview_id.toString());

        const overviews = await this.overviewRepository.findOverviews({ _id: { $in: overviewIds } }, 0, ['original_title'], {});
        const overviewMap = new Map<string, { original_title: string }>();
        for (const overview of overviews) {
            overviewMap.set(overview._id.toString(), overview);
        }

        const mergedHistories = trimmedSearchHistories.map((history) => {
            const overview = overviewMap.get(history.overview_id.toString());
            return {
                ...(history.toObject?.() ?? history),
                original_title: overview?.original_title ?? null,
            };
        });

        return { search_histories: mergedHistories, hasMore };
    }

    public async handleDeleteSearchHistory(profile_id: string, overview_ids: string[]): Promise<void> {
        const { acknowledged, deletedCount } = await this.searchHistoryRepository.deleteSearchHistoriesByProfileAndOverviewIds(profile_id, overview_ids, undefined);
        if (deletedCount === 0) throw new NotFoundException('Search history not found');
        if (!acknowledged) throw new InternalServerErrorException('Failed to acknowledge the deletion');
    }
}
