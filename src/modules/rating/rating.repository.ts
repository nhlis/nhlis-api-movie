import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';
import { BaseRepository } from '../../modules/shared/repositories/base.repository';
import { IdService } from '../../modules/shared/services/id.service';
import { Rating, RatingDocument } from './rating.schema';
import { EMovieSort } from 'src/common';

@Injectable()
export class RatingRepository extends BaseRepository<RatingDocument> {
    private readonly logger = new Logger(RatingRepository.name);

    constructor(
        @InjectModel(Rating.name) private readonly ratingModel: Model<RatingDocument>,
        private readonly idService: IdService,
    ) {
        super(ratingModel);
    }

    // ===== WRITE METHODS =====
    public async createRating(payload: { profile_id: string; overview_id: string; point: number }, session?: ClientSession): Promise<RatingDocument> {
        return this.findOneAndUpdate(
            { profile_id: payload.profile_id, overview_id: payload.overview_id },
            {
                $setOnInsert: { _id: this.idService.handleGenerateId(), profile_id: payload.profile_id, overview_id: payload.overview_id, created_at: new Date() },
                $set: { point: payload.point, updated_at: new Date() },
            },
            { new: true, upsert: true },
            session,
        );
    }

    // ===== UPDATE METHODS =====
    public async updateRating(
        rating_id: string,
        payload: {
            point: number;
        },
        session: ClientSession,
    ): Promise<RatingDocument> {
        return this.findOneAndUpdate({ _id: rating_id }, { ...payload, updated_at: new Date() }, { new: false, upsert: false }, session);
    }

    // ===== DELETE METHODS =====
    public async deleteRatingByOverview(profile_id: string, overview_id: string, session?: ClientSession): Promise<RatingDocument> {
        return this.ratingModel.findOneAndDelete({ profile_id, overview_id }, { session });
    }

    public async deleteRatingsByProfile(profile_id: string, session?: ClientSession): Promise<{ acknowledged: boolean; deletedCount: number }> {
        return this.deleteDocument({ profile_id }, session);
    }

    // ===== READ METHODS =====
    public async findRatings(limit: number, last_id: string, fields: Array<keyof Rating>, sort: Record<string, SortOrder>): Promise<RatingDocument[]> {
        const queryBuilder: FilterQuery<Rating> = {};
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    public async findRatingsByProfileId(profile_id: string, limit: number, last_id: string, fields: Array<keyof Rating>, sort: Record<string, SortOrder>): Promise<RatingDocument[]> {
        const queryBuilder: FilterQuery<Rating> = { profile_id };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    public async findRatingByProfileAndOverview(profile_id: string, overview_id: string, fields: Array<keyof Rating>, lean: boolean): Promise<RatingDocument> {
        return this.findDocument({ overview_id, profile_id }, fields, lean);
    }

    public async findRatingByProfileAndOverviewIds(profile_id: string, overview_ids: string[], fields: Array<keyof Rating>, lean: boolean): Promise<RatingDocument[]> {
        return this.findDocuments({ overview_id: { $in: overview_ids }, profile_id }, 0, fields, {}, lean);
    }

    public async getAverageRatingByOverviewId(overview_id: string): Promise<number> {
        const result = await this.ratingModel.aggregate([{ $match: { overview_id } }, { $group: { _id: null, avgRating: { $avg: '$point' } } }]);

        return result.length > 0 ? result[0].avgRating : 0;
    }

    public async getAverageRatingByOverviewIds(overview_ids: string[]): Promise<{ [overview_id: string]: number }> {
        const result = await this.ratingModel.aggregate([{ $match: { overview_id: { $in: overview_ids } } }, { $group: { _id: '$overview_id', avgRating: { $avg: '$point' } } }]);

        const avgRatings = result.reduce((acc, curr) => {
            acc[curr._id] = curr.avgRating;
            return acc;
        }, {});

        overview_ids.forEach((id) => {
            if (!avgRatings.hasOwnProperty(id)) {
                avgRatings[id] = 0;
            }
        });

        return avgRatings;
    }

    // ===== COUNT METHODS =====
    public async countRatingByOverviewIds(overview_ids: string[]): Promise<Record<string, number>> {
        return this.countDocumentsByIds('overview_id', overview_ids);
    }
}
