import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientSession, FilterQuery, SortOrder } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { EMovieType, EMovieGenre, EMovieLanguage, EMovieSort, EAgeRating, IOverviewRespone } from '../../../common';
import { GoogleDriveService } from '../../shared/services/drive.service';
import { OverviewRepository } from './overview.repository';
import { OverviewDocument } from './overview.schema';
import { BookmarkRepository } from '../../../modules/bookmark/bookmark.repository';
import { BookmarkDocument } from '../../../modules/bookmark/bookmark.schema';
import { RatingRepository } from '../../../modules/rating/rating.repository';
import { RatingDocument } from '../../../modules/rating/rating.schema';

@Injectable()
export class OverviewService {
    private readonly idFolderMovie: string;

    constructor(
        private readonly overviewRepository: OverviewRepository,
        private readonly bookmarkRepository: BookmarkRepository,
        private readonly ratingRepository: RatingRepository,
        private readonly driveService: GoogleDriveService,
        private readonly configService: ConfigService,
    ) {
        this.idFolderMovie = this.configService.get<string>('DRIVE_ID_FOLDER_IMG_MOVIE');
    }

    public async handleSearchOverviews(profile_id: string, keyword: string): Promise<IOverviewRespone[]> {
        try {
            const overviews = await this.overviewRepository.searchOverviews(keyword);

            const overviewIds = overviews.map((o) => o._id.toString());

            let favouriteOverviewIds: BookmarkDocument[] = [];

            if (profile_id) {
                favouriteOverviewIds = await this.bookmarkRepository.findBookmarksByOverviewIdsAndProfileId(overviewIds, profile_id, ['overview_id'], {});
            }

            const bookmarkedOverviewIdSet = new Set(favouriteOverviewIds.map((b) => b.overview_id.toString()));

            const leanOverviews = overviews as unknown as IOverviewRespone[];

            const enrichedOverviews = leanOverviews.map((overview) => ({
                ...overview,
                is_bookmark: bookmarkedOverviewIdSet.has(overview._id.toString()),
            }));

            return enrichedOverviews;
        } catch (error) {
            console.error('Error searching overview:', error);
            throw new InternalServerErrorException({ message: 'Error searching overview' });
        }
    }

    public async handlePostOverview(
        payload: {
            original_title: string;
            alternative_titles?: string[];
            description: string;
            genres: EMovieGenre[];
            type: EMovieType;
            release_date: Date;
            subtitle_languages: EMovieLanguage[];
            dub_languages: EMovieLanguage[];
            age_rating: EAgeRating;
        },
        files: { logoSrc: Express.Multer.File; posterSrc: Express.Multer.File; backdropSrc: Express.Multer.File },
    ): Promise<OverviewDocument> {
        let logo: string = undefined;
        let poster: string = undefined;
        let backdrop: string = undefined;

        try {
            const [logo, poster, backdrop] = await Promise.all([
                this.driveService.UploadImage(files.logoSrc, payload.original_title, undefined, undefined, undefined, this.idFolderMovie),
                this.driveService.UploadImage(files.posterSrc, payload.original_title, undefined, undefined, '2:3', this.idFolderMovie),
                this.driveService.UploadImage(files.backdropSrc, payload.original_title, undefined, undefined, '16:9', this.idFolderMovie),
            ]);

            return this.overviewRepository.createOverview(
                {
                    original_title: payload.original_title,
                    alternative_titles: payload.alternative_titles,
                    description: payload.description,
                    genres: payload.genres,
                    type: payload.type,
                    release_date: payload.release_date,
                    logo,
                    poster,
                    backdrop,
                    subtitle_languages: payload.subtitle_languages,
                    dub_languages: payload.dub_languages,
                    age_rating: payload.age_rating,
                },
                undefined,
            );
        } catch (error) {
            await Promise.all([logo ? this.driveService.DeleteFile(logo) : null, poster ? this.driveService.DeleteFile(poster) : null, backdrop ? this.driveService.DeleteFile(backdrop) : null]);
            throw new InternalServerErrorException({ message: 'Error uploading files' });
        }
    }

    public async handlePatchOverview(
        overview_id: string,
        payload: {
            original_title?: string;
            alternative_titles?: string[];
            description?: string;
            genres?: EMovieGenre[];
            type?: EMovieType;
            release_date?: Date;
            subtitle_languages?: EMovieLanguage[];
            dub_languages?: EMovieLanguage[];
            age_rating?: EAgeRating;
        },
        files: { logoSrc?: Express.Multer.File; posterSrc?: Express.Multer.File; backdropSrc?: Express.Multer.File },
    ): Promise<OverviewDocument> {
        let logo: string = undefined;
        let poster: string = undefined;
        let backdrop: string = undefined;

        try {
            const oldOverview = await this.overviewRepository.findOverviewById(overview_id, ['_id', 'original_title', 'logo', 'poster', 'backdrop'], true);

            const uploadPromises = [
                files.logoSrc ? this.driveService.UploadImage(files.logoSrc, oldOverview.original_title, undefined, undefined, undefined, this.idFolderMovie) : Promise.resolve(undefined),
                files.posterSrc ? this.driveService.UploadImage(files.posterSrc, oldOverview.original_title, undefined, undefined, '2:3', this.idFolderMovie) : Promise.resolve(undefined),
                files.backdropSrc ? this.driveService.UploadImage(files.backdropSrc, oldOverview.original_title, undefined, undefined, '16:9', this.idFolderMovie) : Promise.resolve(undefined),
            ];

            [logo, poster, backdrop] = await Promise.all(uploadPromises);

            const newOverview = await this.overviewRepository.updateOverview(
                overview_id,
                {
                    original_title: payload.original_title,
                    alternative_titles: payload.alternative_titles,
                    description: payload.description,
                    genres: payload.genres,
                    type: payload.type,
                    release_date: payload.release_date,
                    logo,
                    poster,
                    backdrop,
                    subtitle_languages: payload.subtitle_languages,
                    dub_languages: payload.dub_languages,
                    age_rating: payload.age_rating,
                },
                undefined,
            );

            if (!oldOverview) throw new NotFoundException({ message: '' });

            await Promise.all([
                logo && oldOverview.logo && this.driveService.DeleteFile(oldOverview.logo),
                poster && oldOverview.poster && this.driveService.DeleteFile(oldOverview.poster),
                backdrop && oldOverview.backdrop && this.driveService.DeleteFile(oldOverview.backdrop),
            ]);

            return newOverview;
        } catch (error) {
            await Promise.all([logo && this.driveService.DeleteFile(logo), poster && this.driveService.DeleteFile(poster), backdrop && this.driveService.DeleteFile(backdrop)]);
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException({ message: 'Error updating movie' });
        }
    }

    public async handleDeleteOverview(overview_id: string): Promise<void> {
        await this.overviewRepository.transaction(async (session: ClientSession) => {
            const oldOverview = await this.overviewRepository.deleteOverview(overview_id, session);

            if (!oldOverview) throw new NotFoundException({ message: 'Movie not found' });

            await Promise.all([
                oldOverview.logo && this.driveService.DeleteFile(oldOverview.logo),
                oldOverview.poster && this.driveService.DeleteFile(oldOverview.poster),
                oldOverview.backdrop && this.driveService.DeleteFile(oldOverview.backdrop),
            ]);
        });
    }

    public async handleGetOverviews(
        profile_id: string,
        payload: {
            genres: EMovieGenre[];
            type: EMovieType;
            start_date: Date;
            end_date: Date;
            limit: number;
            last_id: string;
            subtitle_languages: EMovieLanguage[];
            dub_languages: EMovieLanguage[];
            age_rating: number;
            release_date: EMovieSort;
            most_rated: EMovieSort;
            highest_rated: EMovieSort;
            most_viewed: EMovieSort;
        },
    ): Promise<{ overviews: Partial<IOverviewRespone>[]; hasMore: boolean }> {
        try {
            const query: FilterQuery<OverviewDocument> = {};

            // Filtering
            if (payload.genres?.length) query.genres = { $in: payload.genres };
            if (payload.subtitle_languages?.length) query.subtitle_languages = { $in: payload.subtitle_languages };
            if (payload.dub_languages?.length) query.dub_languages = { $in: payload.dub_languages };
            if (payload.type) query.type = payload.type;
            if (payload.start_date && payload.end_date) query.release_date = { $gte: payload.start_date, $lte: payload.end_date };
            if (payload.age_rating) query.age_rating = payload.age_rating;

            // Sorting
            const sort: Record<string, SortOrder> = {};
            let sortField: keyof OverviewDocument = 'release_date';
            let sortDirection: SortOrder = EMovieSort.DESC;

            if (payload.most_viewed !== undefined) {
                sortField = 'count_view';
                sortDirection = payload.most_viewed;
                sort.count_view = payload.most_viewed;
            } else if (payload.highest_rated !== undefined) {
                sortField = 'average_rating';
                sortDirection = payload.highest_rated;
                sort.average_rating = payload.highest_rated;
                sort.count_rating = payload.highest_rated;
            } else if (payload.most_rated !== undefined) {
                sortField = 'count_rating';
                sortDirection = payload.most_rated;
                sort.count_rating = payload.most_rated;
                sort.average_rating = payload.most_rated;
            } else {
                if (payload.release_date !== undefined) {
                    sortField = 'release_date';
                    sortDirection = payload.release_date;
                    sort.release_date = payload.release_date;
                } else {
                    sort.release_date = EMovieSort.DESC;
                }
            }

            // Secondary sort by _id for stable pagination
            sort._id = sortDirection;

            // Cursor-based pagination
            if (payload.last_id) {
                const lastOverview = await this.overviewRepository.findOverviewById(payload.last_id, [sortField], true);
                if (lastOverview) {
                    query.$or = [
                        { [sortField]: { [sortDirection === 1 ? '$gt' : '$lt']: lastOverview[sortField] } },
                        {
                            [sortField]: lastOverview[sortField],
                            _id: { [sortDirection === 1 ? '$gt' : '$lt']: lastOverview._id },
                        },
                    ];
                }
            }

            const limitPlusOne = payload.limit + 1;

            const overviews = await this.overviewRepository.findOverviews(
                query,
                limitPlusOne,
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
                sort,
            );

            const hasMore = overviews.length === limitPlusOne;

            const trimmedOverviews = hasMore ? overviews.slice(0, payload.limit) : overviews;

            const overviewIds = trimmedOverviews.map((o) => o._id.toString());

            let favouriteOverviewIds: BookmarkDocument[] = [];

            if (profile_id) {
                favouriteOverviewIds = await this.bookmarkRepository.findBookmarksByOverviewIdsAndProfileId(overviewIds, profile_id, ['overview_id'], {});
            }

            const bookmarkedOverviewIdSet = new Set(favouriteOverviewIds.map((b) => b.overview_id.toString()));

            const leanOverviews = trimmedOverviews as unknown as IOverviewRespone[];

            const enrichedOverviews = leanOverviews.map((overview) => ({
                ...overview,
                ...(bookmarkedOverviewIdSet.has(overview._id.toString()) && { is_bookmark: true }),
            }));

            return { overviews: enrichedOverviews, hasMore };
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to retrieve movies', error });
        }
    }

    public async handleGetOverviewByIds(profile_id: string, overview_ids: string[]): Promise<Partial<IOverviewRespone>[]> {
        try {
            const queryBuilder: FilterQuery<OverviewDocument> = {
                _id: { $in: overview_ids },
            };

            const sortBuilder: { [key: string]: SortOrder } = {
                release_date: EMovieSort.DESC,
            };

            const overviews = await this.overviewRepository.findOverviews(
                queryBuilder,
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
                sortBuilder,
            );

            const overviewIds = overviews.map((o) => o._id.toString());

            let favouriteOverviewIds: BookmarkDocument[] = [];
            let ratingOverviewIds: BookmarkDocument[] = [];

            if (profile_id) {
                favouriteOverviewIds = await this.bookmarkRepository.findBookmarksByOverviewIdsAndProfileId(overviewIds, profile_id, ['overview_id'], {});
                ratingOverviewIds = await this.ratingRepository.findRatingByProfileAndOverviewIds(profile_id, overviewIds, ['overview_id', 'point'], true);
            }

            const bookmarkedOverviewIdSet = new Set(favouriteOverviewIds.map((b) => b.overview_id.toString()));
            const ratingMap = new Map(ratingOverviewIds.map((r: RatingDocument) => [r.overview_id.toString(), r.point]));

            const leanOverviews = overviews as unknown as IOverviewRespone[];

            const enrichedOverviews = leanOverviews.map((overview) => ({
                ...overview,
                ...(bookmarkedOverviewIdSet.has(overview._id.toString()) && { is_bookmark: true }),
                ...(ratingMap.has(overview._id.toString()) && { rating_point: ratingMap.get(overview._id.toString()) }),
            }));

            return enrichedOverviews;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException({ message: 'Error finding movie' });
        }
    }

    public async handleGetOverviewCount(): Promise<number> {
        return this.overviewRepository.countDocuments({});
    }
}
