import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FilterQuery, SortOrder } from 'mongoose';

import { History, HistoryDocument } from './history.schema';
import { HistoryRepository } from './history.repository';
import { IEpisodeResponse, IOverviewRespone, IHistoryRespone, ESort } from '../../common';
import { EpisodeRepository } from '../movies/episode/episode.repository';
import { OverviewRepository } from '../movies/overview/overview.repository';

@Injectable()
export class HistoryService {
    constructor(
        private readonly historyRepository: HistoryRepository,
        private readonly overviewRepository: OverviewRepository,
        private readonly episodeRepository: EpisodeRepository,
    ) {}

    public async handleCreateOrUpdateHistory(payload: { profile_id: string; overview_id: string; episode_id: string }): Promise<void> {
        await this.historyRepository.ensureHistory({ profile_id: payload.profile_id, overview_id: payload.overview_id, episode_id: payload.episode_id });
    }

    public async handleDeleteEpisodeInHistory(profile_id: string, _id: string): Promise<void> {
        await this.historyRepository.deleteHistory({ _id, profile_id });
    }

    public async handleClearHistories(profile_id: string): Promise<void> {
        await this.historyRepository.deleteHistories(profile_id);
    }

    public async handleGetHistoriesByProfile(profile_id: string, limit: number, last_id: string): Promise<{ histories: IHistoryRespone[]; hasMore: boolean }> {
        try {
            const query: FilterQuery<HistoryDocument> = {
                profile_id,
            };

            const sort: Record<string, SortOrder> = {};
            const sortField: keyof HistoryDocument = 'updated_at';
            const sortDirection: SortOrder = ESort.DESC;

            sort[sortField] = sortDirection;
            sort._id = sortDirection;

            if (last_id) {
                const lastHistory = await this.historyRepository.findHistory({ _id: last_id, profile_id }, [sortField], true);

                if (lastHistory) {
                    query.$or = [
                        {
                            [sortField]: { ['$lt']: lastHistory[sortField] },
                        },
                        {
                            [sortField]: lastHistory[sortField],
                            _id: { ['$lt']: lastHistory._id },
                        },
                    ];
                }
            }

            const limitPlusOne = limit + 1;

            const views = await this.historyRepository.findHistories(query, limitPlusOne, ['_id', 'overview_id', 'episode_id'], sort);

            const hasMore = views.length === limitPlusOne;

            const trimmedViews = hasMore ? views.slice(0, limit) : views;

            const episodeIds = trimmedViews.map((v) => v.episode_id);
            const overviewIds = trimmedViews.map((v) => v.overview_id);

            const episodes = await this.episodeRepository.findEpisodes(
                { _id: { $in: episodeIds } },
                0,
                ['_id', 'title', 'description', 'episode_number', 'duration', 'release_date', 'img', 'premium'],
                {},
            );

            const overviews = await this.overviewRepository.findOverviews({ _id: { $in: overviewIds } }, 0, ['_id', 'original_title', 'type'], {});

            const overviewMap = new Map((overviews as unknown as IOverviewRespone[]).map((o) => [o._id.toString(), o]));

            const episodeMap = new Map((episodes as unknown as IEpisodeResponse[]).map((o) => [o._id.toString(), o]));

            const enrichedViewEpisodes = trimmedViews
                .map((v) => {
                    const overview = overviewMap.get(v.overview_id.toString());
                    if (!overview) return null;
                    const episode = episodeMap.get(v.episode_id.toString());
                    if (!episode) return null;

                    return {
                        _id: v._id,
                        overview_id: overview._id,
                        overview_title: overview.original_title,
                        overview_type: overview.type,
                        episode_id: episode._id,
                        episode_title: episode.title,
                        episode_description: episode.description,
                        episode_duration: episode.duration,
                        episode_number: episode.episode_number,
                        episode_img: episode.img,
                        episode_premium: episode.premium,
                        episode_release_date: episode.release_date,
                    };
                })
                .filter(Boolean);

            return { histories: enrichedViewEpisodes, hasMore };
        } catch (error) {
            throw new InternalServerErrorException('Error finding episode');
        }
    }
}
