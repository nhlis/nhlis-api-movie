import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { RatingRepository } from './rating.repository';
import { RatingDocument } from './rating.schema';
import { ClientSession, SortOrder } from 'mongoose';
import { EMovieSort } from '../../common';
import { ProfileRepository } from '../../modules/profile/profile.repository';
import { OverviewRepository } from '../../modules/movies/overview/overview.repository';

@Injectable()
export class RatingService {
    constructor(
        private readonly ratingRepository: RatingRepository,
        private readonly profileRepository: ProfileRepository,
        private readonly overviewRepository: OverviewRepository,
    ) {}

    public async handlePostRating(payload: { profile_id: string; overview_id: string; point: number }): Promise<RatingDocument> {
        return this.ratingRepository.transaction(async (session: ClientSession) => {
            const [overview, profile, existingRating] = await Promise.all([
                this.overviewRepository.findOverviewById(payload.overview_id, ['_id', 'total_rating', 'count_rating'], true),
                this.profileRepository.findProfileById(payload.profile_id, ['_id'], true),
                this.ratingRepository.findRatingByProfileAndOverview(payload.profile_id, payload.overview_id, ['point'], true),
            ]);

            if (!overview) throw new NotFoundException({ message: 'Overview not found' });
            if (!profile) throw new NotFoundException({ message: 'Profile not found' });

            let rating: RatingDocument;
            let totalRatingChange = payload.point;
            let isNewRating = false;

            if (existingRating) {
                totalRatingChange = payload.point - existingRating.point;
                rating = await this.ratingRepository.updateRating(existingRating._id, { point: payload.point }, session);
            } else {
                rating = await this.ratingRepository.createRating(payload, session);
                isNewRating = true;
            }

            // Tính toán giá trị mới
            const newTotalRating = (overview.total_rating ?? 0) + totalRatingChange;
            const newCountRating = (overview.count_rating ?? 0) + (isNewRating ? 1 : 0);
            const newAverageRating = newCountRating > 0 ? newTotalRating / newCountRating : 0;

            // Gọi cập nhật vào repository
            await this.overviewRepository.incrementOverviewStats(
                overview._id,
                {
                    total_rating: totalRatingChange,
                    count_rating: isNewRating ? 1 : 0,
                    average_rating: newAverageRating,
                },
                session,
            );

            return rating;
        });
    }

    public async handleGetRatings(limit: number, last_id: string, created_at: EMovieSort): Promise<RatingDocument[]> {
        const sortQuery: { [key: string]: SortOrder } = {
            created_at: Object.values(EMovieSort).includes(created_at) ? created_at : EMovieSort.DESC,
        };
        return this.ratingRepository.findRatings(limit, last_id, ['_id', 'profile_id', 'overview_id', 'point', 'created_at', 'updated_at'], sortQuery);
    }

    public async handleGetRatingsByProfile(profile_id: string, limit: number, last_id: string, created_at: EMovieSort): Promise<RatingDocument[]> {
        const sortQuery: { [key: string]: SortOrder } = {
            created_at: Object.values(EMovieSort).includes(created_at) ? created_at : EMovieSort.DESC,
        };
        return this.ratingRepository.findRatingsByProfileId(profile_id, limit, last_id, ['_id', 'profile_id', 'overview_id', 'point', 'created_at'], sortQuery);
    }

    public async handleDeleteRating(profile_id: string, overview_id: string): Promise<void> {
        return this.ratingRepository.transaction(async (session: ClientSession) => {
            const [overview, rating] = await Promise.all([
                this.overviewRepository.findOverviewById(overview_id, ['average_rating', 'count_rating', 'total_rating'], true),
                this.ratingRepository.deleteRatingByOverview(profile_id, overview_id, session),
            ]);

            if (!overview) throw new NotFoundException({ message: 'Overview not found' });
            if (!rating) throw new NotFoundException('Rating not found');

            const newTotal = overview.total_rating - rating.point;
            const newCount = overview.count_rating - 1;
            const newAverage = newCount > 0 ? newTotal / newCount : 0;

            await this.overviewRepository.incrementOverviewStats(
                rating.overview_id,
                {
                    count_rating: -1,
                    total_rating: -rating.point,
                    average_rating: newAverage,
                },
                session,
            );
        });
    }

    public async handleDeleteRatingsByProfile(profile_id: string): Promise<void> {
        const { acknowledged, deletedCount } = await this.ratingRepository.deleteRatingsByProfile(profile_id);
        if (deletedCount === 0) throw new NotFoundException('No ratings found for this profile');
        if (!acknowledged) throw new InternalServerErrorException('Failed to delete ratings');
    }

    public async handleGetAverageRatingByOverviewId(overview_id: string): Promise<{ ratingCounts: number; average: number }> {
        const [ratingCounts, average] = await Promise.all([this.ratingRepository.countDocuments({ overview_id }), this.ratingRepository.getAverageRatingByOverviewId(overview_id)]);
        return { ratingCounts, average };
    }
}
