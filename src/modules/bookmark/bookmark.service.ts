import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FilterQuery } from 'mongoose';

import { BookmarkRepository } from './bookmark.repository';
import { Bookmark, BookmarkDocument } from './bookmark.schema';
import { ProfileRepository } from '../profile/profile.repository';
import { OverviewRepository } from '../movies/overview/overview.repository';
import { EMovieSort, IOverviewRespone } from '../../common';

@Injectable()
export class BookmarkService {
    constructor(
        private readonly bookmarkRepository: BookmarkRepository,
        private readonly overviewRepository: OverviewRepository,
        private readonly profileRepository: ProfileRepository,
    ) {}

    public async handlePostBookmark(payload: { profile_id: string; overview_id: string }): Promise<BookmarkDocument> {
        const [overview, profile] = await Promise.all([
            this.overviewRepository.findOverviewById(payload.overview_id, ['_id'], true),
            this.profileRepository.findProfileById(payload.profile_id, ['_id'], true),
        ]);
        if (!overview) throw new NotFoundException({ message: 'Overview not found' });
        if (!profile) throw new NotFoundException({ message: 'Profile not found' });

        return this.bookmarkRepository.createBookmark({ profile_id: payload.profile_id, overview_id: payload.overview_id }, undefined);
    }

    public async handleDeleteBookmark(profile_id: string, overview_id: string): Promise<void> {
        const { acknowledged, deletedCount } = await this.bookmarkRepository.deleteBookmark(profile_id, overview_id, undefined);
        if (deletedCount === 0) throw new NotFoundException('User or Overview not found');
        if (!acknowledged) throw new InternalServerErrorException('Failed to acknowledge the deletion');
    }

    public async handleGetBookmarks(profile_id: string, limit: number, last_id: string, created_at: EMovieSort): Promise<{ bookmarks: IOverviewRespone[]; hasMore: boolean }> {
        try {
            const queryBuilder: FilterQuery<Bookmark> = { profile_id };

            if (last_id) queryBuilder._id = created_at === EMovieSort.DESC ? { $gt: last_id } : { $lt: last_id };

            const limitPlusOne = limit + 1;

            const bookmarks = await this.bookmarkRepository.findBookmarks(queryBuilder, limitPlusOne, last_id, ['_id', 'profile_id', 'overview_id', 'created_at', 'updated_at'], { created_at });

            const hasMore = bookmarks.length === limitPlusOne;

            const trimmedBookmarks = hasMore ? bookmarks.slice(0, limit) : bookmarks;

            const overviewIds = trimmedBookmarks.map((b) => b.overview_id);

            const overviews = await this.overviewRepository.findOverviews(
                { _id: { $in: overviewIds } },
                0,
                [
                    '_id',
                    'original_title',
                    'alternative_titles',
                    'description',
                    'genres',
                    'type',
                    'release_date',
                    'logo',
                    'poster',
                    'backdrop',
                    'subtitle_languages',
                    'dub_languages',
                    'age_rating',
                    'total_rating',
                    'count_rating',
                    'average_rating',
                    'count_episode',
                    'count_season',
                    'count_view',
                    'created_at',
                    'updated_at',
                ],
                {},
            );

            const overviewMap = new Map((overviews as unknown as IOverviewRespone[]).map((o) => [o._id.toString(), o]));

            const enrichedBookmarks = trimmedBookmarks
                .map((b) => {
                    const overview = overviewMap.get(b.overview_id.toString());
                    if (!overview) return null;
                    return {
                        ...overview,
                        is_bookmark: true,
                    };
                })
                .filter(Boolean);

            return { bookmarks: enrichedBookmarks, hasMore };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Error finding episode');
        }
    }
}
