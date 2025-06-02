import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';

import { Season, SeasonDocument } from './season.schema';
import { BaseRepository } from '../../../modules/shared/repositories/base.repository';
import { IdService } from '../../../modules/shared/services/id.service';
import { EMovieSort } from 'src/common';

@Injectable()
export class SeasonRepository extends BaseRepository<SeasonDocument> {
    private readonly logger = new Logger(SeasonRepository.name);

    constructor(
        @InjectModel(Season.name) private readonly seasonModel: Model<SeasonDocument>,
        private readonly idService: IdService,
    ) {
        super(seasonModel);
    }

    // ===== WRITE METHODS =====
    public async createSeason(
        payload: {
            overview_id: string;
            name: string;
        },
        session: ClientSession,
    ): Promise<Season> {
        return this.createDocument(
            {
                _id: this.idService.handleGenerateId(),
                overview_id: payload.overview_id,
                name: payload.name,
                created_at: new Date(),
            },
            session,
        );
    }

    // ===== UPDATE METHODS =====
    public async updateSeason(
        season_id: string,
        payload: {
            overview_id: string;
            name: string;
        },
        session: ClientSession,
    ): Promise<{
        matchedCount: number;
        modifiedCount: number;
    }> {
        return this.updateDocument({ _id: season_id }, { ...payload, updated_at: new Date() }, session);
    }

    // ===== INCREMENT METHODS =====
    public async incrementSeasonStats(
        season_id: string,
        payload: {
            count_episode?: number;
        },
        session?: ClientSession,
    ): Promise<void> {
        const inc: any = {};
        const set: any = { updated_at: new Date() };

        if (payload.count_episode) inc.count_episode = payload.count_episode;

        await this.seasonModel.updateOne({ _id: season_id }, { $inc: inc, $set: set }, { session });
    }

    // ===== DELETE METHODS =====
    public async deleteSeasonById(season_id: string, session: ClientSession): Promise<SeasonDocument> {
        return this.seasonModel.findOneAndDelete({ _id: season_id, count_episode: 0 }, { session });
    }

    // ===== READ METHODS =====
    public async findSeasonById(season_id: string, fields: Array<keyof Season>, lean: boolean): Promise<SeasonDocument> {
        return this.findDocument({ _id: season_id }, fields, lean);
    }

    public async findSeasons(limit: number, last_id: string, fields: Array<keyof Season>, sort: Record<string, SortOrder>): Promise<SeasonDocument[]> {
        const queryBuilder: FilterQuery<Season> = {};
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    public async findSeasonsByOverviewIds(overviewIds: string[], fields: Array<keyof Season> = []): Promise<SeasonDocument[]> {
        const queryBuilder: FilterQuery<Season> = {
            overview_id: { $in: overviewIds },
        };
        return this.findDocuments(queryBuilder, 0, fields);
    }

    public async findSeasonsByOverview(overview_id: string, limit: number, last_id: string, fields: Array<keyof Season>, sort: Record<string, SortOrder>): Promise<SeasonDocument[]> {
        const queryBuilder: FilterQuery<Season> = { overview_id };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    // ===== COUNT METHODS =====
    public async countSeasonsByOverviewIds(overview_ids: string[]): Promise<Record<string, number>> {
        return this.countDocumentsByIds('overview_id', overview_ids);
    }
}
