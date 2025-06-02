import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientSession, SortOrder } from 'mongoose';

import { SeasonRepository } from './season.repository';
import { EMovieSort } from '../../../common';
import { SeasonDocument } from './season.schema';
import { OverviewRepository } from '../overview/overview.repository';
import { OverviewDocument } from '../overview/overview.schema';

@Injectable()
export class SeasonService {
    constructor(
        private readonly seasonRepository: SeasonRepository,
        private readonly overviewRepository: OverviewRepository,
    ) {}

    public async handlePostSeason(payload: { overview_id: string; name: string }): Promise<Partial<SeasonDocument>> {
        return this.seasonRepository.transaction(async (session: ClientSession) => {
            const overview: OverviewDocument = await this.overviewRepository.findOverviewById(payload.overview_id, ['_id'], true);
            if (!overview) throw new NotFoundException({ message: `Overview not found` });
            const season = await this.seasonRepository.createSeason({ overview_id: payload.overview_id, name: payload.name }, session);
            await this.overviewRepository.incrementOverviewStats(overview._id, { count_season: 1 }, session);
            return season;
        });
    }

    public async handlePatchSeason(season_id: string, payload: { overview_id: string; name: string }): Promise<void> {
        const { matchedCount, modifiedCount } = await this.seasonRepository.updateSeason(season_id, { overview_id: payload.overview_id, name: payload.name }, undefined);
        if (matchedCount === 0) throw new NotFoundException('Season not found');
        if (modifiedCount === 0) throw new InternalServerErrorException('No changes were made to the season');
    }

    public async handleGetSeasons(limit: number, last_id: string, created_at: EMovieSort): Promise<SeasonDocument[]> {
        const sortQuery: { [key: string]: SortOrder } = {
            release_date: Object.values(EMovieSort).includes(created_at) ? created_at : EMovieSort.DESC,
        };
        return this.seasonRepository.findSeasons(limit, last_id, ['_id', 'overview_id', 'name', 'count_episode', 'created_at', 'updated_at'], sortQuery);
    }

    public async handleGetSeasonsCount(): Promise<number> {
        return this.seasonRepository.countDocuments({});
    }

    public async handleGetSeasonsByOverview(overview_id: string, limit: number, last_id: string, created_at: EMovieSort): Promise<SeasonDocument[]> {
        const sortQuery: { [key: string]: SortOrder } = {
            release_date: Object.values(EMovieSort).includes(created_at) ? created_at : EMovieSort.DESC,
        };
        return this.seasonRepository.findSeasonsByOverview(overview_id, limit, last_id, ['_id', 'overview_id', 'name', 'count_episode', 'created_at', 'updated_at'], sortQuery);
    }

    public async handleGetSeasonsCountByOverview(overview_id: string): Promise<number> {
        return this.seasonRepository.countDocuments({ overview_id });
    }

    public async handleDeleteSeason(season_id: string): Promise<void> {
        return this.seasonRepository.transaction(async (session: ClientSession) => {
            const deletedSeason = await this.seasonRepository.deleteSeasonById(season_id, session);
            if (!deletedSeason) throw new NotFoundException('Season not found');
            await this.overviewRepository.incrementOverviewStats(deletedSeason.overview_id, { count_season: -1 }, session);
        });
    }
}
