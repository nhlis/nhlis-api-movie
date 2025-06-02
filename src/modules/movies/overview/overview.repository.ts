import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, PipelineStage, SortOrder } from 'mongoose';

import { EAgeRating, EMovieLanguage, EMovieGenre, EMovieType } from '../../../common';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { IdService } from '../../shared/services/id.service';
import { Overview, OverviewDocument } from './overview.schema';

@Injectable()
export class OverviewRepository extends BaseRepository<OverviewDocument> {
    private readonly logger = new Logger(OverviewRepository.name);

    constructor(
        @InjectModel(Overview.name) private readonly overviewModel: Model<OverviewDocument>,
        private readonly idService: IdService,
    ) {
        super(overviewModel);
    }

    // ===== WRITE METHODS =====
    public async createOverview(
        payload: {
            original_title: string;
            alternative_titles: string[];
            description: string;
            genres: EMovieGenre[];
            type: EMovieType;
            release_date: Date;
            logo: string;
            poster: string;
            backdrop: string;
            subtitle_languages: EMovieLanguage[];
            dub_languages: EMovieLanguage[];
            age_rating: EAgeRating;
        },
        session: ClientSession,
    ): Promise<OverviewDocument> {
        return this.createDocument(
            {
                _id: this.idService.handleGenerateId(),
                original_title: payload.original_title,
                alternative_titles: payload.alternative_titles,
                description: payload.description,
                genres: payload.genres,
                type: payload.type,
                release_date: payload.release_date,
                logo: payload.logo,
                poster: payload.poster,
                backdrop: payload.backdrop,
                subtitle_languages: payload.subtitle_languages,
                dub_languages: payload.dub_languages,
                age_rating: payload.age_rating,
                created_at: new Date(),
            },
            session,
        );
    }

    // ===== UPDATE METHODS =====
    public async updateOverview(
        overview_id: string,
        payload: {
            original_title?: string;
            alternative_titles?: string[];
            description?: string;
            genres?: EMovieGenre[];
            type?: EMovieType;
            release_date?: Date;
            logo?: string;
            poster?: string;
            backdrop?: string;
            subtitle_languages?: EMovieLanguage[];
            dub_languages?: EMovieLanguage[];
            age_rating?: EAgeRating;
        },
        session: ClientSession,
    ): Promise<OverviewDocument> {
        return this.findOneAndUpdate(
            { _id: overview_id },
            {
                ...payload,
                updated_at: new Date(),
            },
            { upsert: false, new: true },
            session,
        );
    }

    // ===== INCREMENT METHODS =====
    public async incrementOverviewStats(
        overview_id: string,
        payload: {
            total_rating?: number;
            count_rating?: number;
            average_rating?: number;
            count_season?: number;
            count_episode?: number;
            count_view?: number;
        },
        session?: ClientSession,
    ): Promise<void> {
        const inc: any = {};
        const set: any = { updated_at: new Date() };

        if (payload.count_season) inc.count_season = payload.count_season;
        if (payload.count_episode) inc.count_episode = payload.count_episode;
        if (payload.count_rating) inc.count_rating = payload.count_rating;
        if (payload.count_view) inc.count_view = payload.count_view;
        if (payload.total_rating !== undefined) inc.total_rating = payload.total_rating;
        if (payload.average_rating !== undefined) set.average_rating = payload.average_rating;

        await this.overviewModel.updateOne({ _id: overview_id }, { $inc: inc, $set: set }, { session });
    }

    // ===== DELETE METHODS =====
    public async deleteOverview(overview_id: string, session: ClientSession): Promise<OverviewDocument> {
        return this.findOneAndDelete({ _id: overview_id, count_episode: 0 }, session);
    }

    // ===== READ METHODS =====
    public async findOverviewById(overview_id: string, fields: Array<keyof Overview>, lean: boolean): Promise<OverviewDocument> {
        return this.findDocument({ _id: overview_id }, fields, lean);
    }

    public async findOverviews(query: FilterQuery<Overview> = {}, limit: number, fields: Array<keyof Overview>, sort: Record<string, SortOrder>): Promise<OverviewDocument[]> {
        return this.findDocuments(query, limit, fields, sort, true);
    }

    public async searchOverviews(keyword: string) {
        const pipeline: PipelineStage[] = [
            {
                $search: {
                    index: 'default',
                    text: {
                        query: keyword,
                        path: ['original_title', 'alternative_titles', 'description'],
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    original_title: 1,
                    alternative_titles: 1,
                    description: 1,
                    genres: 1,
                    type: 1,
                    logo: 1,
                    poster: 1,
                    backdrop: 1,
                    subtitle_languages: 1,
                    dub_languages: 1,
                    age_rating: 1,
                    total_rating: 1,
                    average_rating: 1,
                    count_rating: 1,
                    count_season: 1,
                    count_episode: 1,
                    created_at: 1,
                    updated_at: 1,
                },
            },
        ];

        return this.aggregate(pipeline);
    }
}
