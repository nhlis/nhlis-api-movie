import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';

import { Episode, EpisodeDocument } from './episode.schema';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { IdService } from '../../shared/services/id.service';
import { EMovieSort } from 'src/common';

@Injectable()
export class EpisodeRepository extends BaseRepository<EpisodeDocument> {
    private readonly logger = new Logger(EpisodeRepository.name);

    constructor(
        @InjectModel(Episode.name) private readonly episodeModel: Model<EpisodeDocument>,
        private readonly idService: IdService,
    ) {
        super(episodeModel);
    }

    // ===== WRITE METHODS =====
    public async createEpisode(
        payload: {
            overview_id: string;
            season_id: string;
            title: string;
            description: string;
            episode_number: number;
            duration: number;
            release_date: Date;
            premium: boolean;
            uri: string;
            img: string;
        },
        session: ClientSession,
    ): Promise<EpisodeDocument> {
        return this.createDocument(
            {
                _id: this.idService.handleGenerateId(),
                overview_id: payload.overview_id,
                season_id: payload.season_id,
                title: payload.title,
                description: payload.description,
                episode_number: payload.episode_number,
                duration: payload.duration,
                release_date: payload.release_date,
                premium: payload.premium,
                uri: payload.uri,
                img: payload.img,
            },
            session,
        );
    }

    // ===== UPDATE METHODS =====
    public async updateEpisodeById(
        episode_id: string,
        payload: {
            overview_id?: string;
            season_id?: string;
            title?: string;
            description?: string;
            episode_number?: number;
            duration?: number;
            release_date?: Date;
            premium?: boolean;
            uri?: string;
            img?: string;
        },
        session: ClientSession,
    ): Promise<EpisodeDocument> {
        return this.findOneAndUpdate({ _id: episode_id }, { ...payload, updated_at: new Date() }, { new: true, upsert: false }, session);
    }

    // ===== INCREMENT METHODS =====
    public async incrementEpisodeStats(
        episode_id: string,
        payload: {
            count_view?: number;
            count_comment?: number;
            count_like?: number;
            count_dislike?: number;
        },
        session?: ClientSession,
    ): Promise<void> {
        const inc: any = {};
        const set: any = { updated_at: new Date() };

        if (payload.count_view) inc.count_view = payload.count_view;
        if (payload.count_comment) inc.count_comment = payload.count_comment;
        if (payload.count_like) inc.count_like = payload.count_like;
        if (payload.count_dislike) inc.count_dislike = payload.count_dislike;

        await this.episodeModel.updateOne({ _id: episode_id }, { $inc: inc, $set: set }, { session });
    }

    // ===== DELETE METHODS =====
    public async deleteEpisode(episode_id: string, session: ClientSession): Promise<EpisodeDocument> {
        return this.findOneAndDelete({ _id: episode_id }, session);
    }

    // ===== READ METHODS =====
    public async findEpisodes(query: FilterQuery<Episode> = {}, limit: number, fields: Array<keyof Episode>, sort: Record<string, SortOrder>): Promise<EpisodeDocument[]> {
        return this.findDocuments(query, limit, fields, sort, true);
    }

    public async findEpisodesBySeasonIds(season_ids: string[], fields: Array<keyof Episode> = []): Promise<EpisodeDocument[]> {
        const queryBuilder: FilterQuery<Episode> = {
            season_id: { $in: season_ids },
        };
        return this.findDocuments(queryBuilder, 0, fields);
    }

    public async findEpisodeById(episode_id: string, fields: Array<keyof Episode>, lean: boolean): Promise<Partial<EpisodeDocument>> {
        return this.findDocument({ _id: episode_id }, fields, lean);
    }

    public async findEpisodesBySeason(season_id: string, limit: number, last_id: string, fields: Array<keyof Episode>, sort: Record<string, SortOrder>): Promise<EpisodeDocument[]> {
        const queryBuilder: FilterQuery<Episode> = { season_id };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    public async findEpisodeNumber(episode_number: number, season_id: string, fields: Array<keyof Episode>, lean: boolean): Promise<EpisodeDocument> {
        return this.findDocument({ episode_number, season_id }, fields, lean);
    }

    // ===== COUNT METHODS =====
    public async countEpisodesBySeasonIds(season_ids: string[]): Promise<Record<string, number>> {
        return this.countDocumentsByIds('season_id', season_ids);
    }
}
