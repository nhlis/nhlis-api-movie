import { BadRequestException, ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ClientSession, FilterQuery, SortOrder } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { EpisodeDocument } from './episode.schema';
import { EEntityType, EMovieSort, EReactionType, IEpisodeResponse, ESort } from '../../../common';
import { EpisodeRepository } from './episode.repository';
import { SeasonRepository } from '../season/season.repository';
import { GoogleDriveService } from '../../../modules/shared/services/drive.service';
import { ProfileRepository } from '../../profile/profile.repository';
import { OverviewRepository } from '../overview/overview.repository';
import { ReactionRepository } from '../../../modules/reaction/reaction.repository';

@Injectable()
export class EpisodeService {
    private readonly logger = new Logger(EpisodeService.name);
    private readonly idFolderEpisodes: string;

    constructor(
        private readonly episodeRepository: EpisodeRepository,
        private readonly overviewRepository: OverviewRepository,
        private readonly seasonRepository: SeasonRepository,
        private readonly profileRepository: ProfileRepository,
        private readonly reactionRepository: ReactionRepository,
        private readonly driveService: GoogleDriveService,
        private readonly configService: ConfigService,
    ) {
        this.idFolderEpisodes = this.configService.get<string>('DRIVE_ID_FOLDER_IMG_EPISODES');
    }

    public async handlePostEpisode(
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
        },
        files: { imgSrc: Express.Multer.File },
    ): Promise<EpisodeDocument> {
        let img: string = undefined;

        try {
            return this.episodeRepository.transaction(async (session: ClientSession) => {
                const [overview, season, episode] = await Promise.all([
                    this.overviewRepository.findOverviewById(payload.overview_id, ['_id'], true),
                    this.seasonRepository.findSeasonById(payload.season_id, ['_id', 'name', 'overview_id'], true),
                    this.episodeRepository.findEpisodeNumber(payload.episode_number, payload.season_id, ['_id'], true),
                ]);

                if (!overview) throw new NotFoundException({ message: `Overview not found` });
                if (!season) throw new NotFoundException({ message: `Season not found` });
                if (episode) throw new ConflictException({ message: `The set ${payload.episode_number} already exists.` });

                img = await this.driveService.UploadImage(files.imgSrc, payload.title, 480, 270, '16:9', this.idFolderEpisodes);

                const newEpisode = await this.episodeRepository.createEpisode(
                    {
                        overview_id: overview._id,
                        season_id: season._id,
                        title: payload.title,
                        description: payload.description,
                        episode_number: payload.episode_number,
                        duration: payload.duration,
                        release_date: payload.release_date,
                        premium: payload.premium,
                        uri: payload.uri,
                        img: img,
                    },
                    session,
                );

                await this.overviewRepository.incrementOverviewStats(season.overview_id, { count_episode: 1 }, session);
                await this.seasonRepository.incrementSeasonStats(season._id, { count_episode: 1 }, session);

                return newEpisode;
            });
        } catch (error) {
            if (img) await this.driveService.DeleteFile(img);
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('Failed to save episode');
        }
    }

    public async handlePatchEpisode(
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
        },
        files: { imgSrc?: Express.Multer.File },
    ): Promise<EpisodeDocument> {
        let img: string = undefined;

        try {
            const oldEpisode = await this.episodeRepository.findEpisodeById(episode_id, ['_id', 'title', 'img'], true);

            if (!oldEpisode) throw new NotFoundException({ message: '' });

            if (files.imgSrc) img = await this.driveService.UploadImage(files.imgSrc, oldEpisode.title, 480, 270, '16:9', this.idFolderEpisodes);

            const newEpisode = await this.episodeRepository.updateEpisodeById(
                episode_id,
                {
                    overview_id: payload.overview_id,
                    season_id: payload.season_id,
                    title: payload.title,
                    description: payload.description,
                    episode_number: payload.episode_number,
                    duration: payload.duration,
                    release_date: payload.release_date,
                    premium: payload.premium,
                    uri: payload.uri,
                    img: img,
                },
                undefined,
            );

            if (img && oldEpisode.img) await this.driveService.DeleteFile(oldEpisode.img);

            return newEpisode;
        } catch (error) {
            if (img) await this.driveService.DeleteFile(img);
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException({ message: 'Error updating episode' });
        }
    }

    public async handleDeleteEpisode(episode_id: string): Promise<void> {
        await this.episodeRepository.transaction(async (session: ClientSession) => {
            const oldEpisode = await this.episodeRepository.deleteEpisode(episode_id, session);
            if (!oldEpisode) throw new NotFoundException({ message: 'Episode not found' });
            if (oldEpisode.img) await this.driveService.DeleteFile(oldEpisode.img);
            await this.overviewRepository.incrementOverviewStats(oldEpisode.overview_id, { count_episode: -1 }, session);
            await this.seasonRepository.incrementSeasonStats(oldEpisode.season_id, { count_episode: -1 }, session);
        });
    }

    public async handleGetURLByEpisodeId(profile_id: string, episode_id: string): Promise<{ uri: string }> {
        try {
            const episode = await this.episodeRepository.findEpisodeById(episode_id, ['uri', 'premium'], true);
            if (!episode) throw new NotFoundException('Episode not found');

            // if (episode.premium) {
            //     if (!profile_id) throw new ForbiddenException({ message: 'You must be logged in to access premium content' });
            //     const profile = await this.profileRepository.findProfileById(profile_id, ['premium'], true);
            //     if (!profile || !profile.premium) throw new ForbiddenException({ message: 'You need a premium account to access this episode' });
            // }
            // return episode;

            const profile = await this.profileRepository.findProfileById(profile_id, ['premium'], true);

            return { uri: profile_id && profile.premium ? episode.uri : '176607868580012801' };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof UnauthorizedException) throw error;
            throw new InternalServerErrorException({ message: 'Error finding episode' });
        }
    }

    public async handleGetEpisodesInContext(
        profile_id: string,
        episode_id: string,
    ): Promise<{
        previous?: Partial<IEpisodeResponse>;
        current: Partial<IEpisodeResponse>;
        next?: Partial<IEpisodeResponse>;
    }> {
        try {
            const currentEpisode = await this.episodeRepository.findEpisodeById(
                episode_id,
                [
                    '_id',
                    'overview_id',
                    'season_id',
                    'title',
                    'description',
                    'episode_number',
                    'duration',
                    'release_date',
                    'img',
                    'premium',
                    'count_view',
                    'count_comment',
                    'count_like',
                    'count_dislike',
                    'created_at',
                    'updated_at',
                ],
                true,
            );

            if (!currentEpisode) throw new NotFoundException('Episode not found');

            const { overview_id, episode_number } = currentEpisode;

            const neighborEpisodes = await this.episodeRepository.findEpisodes(
                {
                    overview_id,
                    episode_number: { $in: [episode_number - 1, episode_number + 1] },
                },
                0,
                [
                    '_id',
                    'overview_id',
                    'season_id',
                    'title',
                    'description',
                    'episode_number',
                    'duration',
                    'release_date',
                    'img',
                    'premium',
                    'count_view',
                    'count_comment',
                    'count_like',
                    'count_dislike',
                    'created_at',
                    'updated_at',
                ],
                { episode_number: ESort.ASC },
            );

            const previousEpisode = neighborEpisodes.find((e) => e.episode_number === episode_number - 1);
            const nextEpisode = neighborEpisodes.find((e) => e.episode_number === episode_number + 1);

            let reaction_type: EReactionType | undefined;

            if (profile_id) {
                const reaction = await this.reactionRepository.findReactionByProfileAndEntityIdAndEntityType(profile_id, currentEpisode._id, EEntityType.EPISODE, ['reaction_type'], true);
                if (reaction) reaction_type = reaction.reaction_type;
            }

            return {
                previous: previousEpisode,
                current: { ...currentEpisode, reaction_type },
                next: nextEpisode,
            };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException({ message: 'Error finding episode' });
        }
    }

    public async handleGetEpisodesBySeason(season_id: string, limit: number, last_id: string, release_date: EMovieSort): Promise<{ episodes: EpisodeDocument[]; hasMore: boolean }> {
        try {
            const sortQuery: { [key: string]: SortOrder } = {
                release_date: Object.values(EMovieSort).includes(release_date) ? release_date : EMovieSort.DESC,
            };

            const limitPlusOne = limit + 1;

            const episodes = await this.episodeRepository.findEpisodesBySeason(
                season_id,
                limitPlusOne,
                last_id,
                [
                    '_id',
                    'overview_id',
                    'season_id',
                    'title',
                    'description',
                    'episode_number',
                    'duration',
                    'release_date',
                    'img',
                    'premium',
                    'count_view',
                    'count_comment',
                    'count_like',
                    'count_dislike',
                    'created_at',
                    'updated_at',
                ],
                sortQuery,
            );

            const hasMore = episodes.length === limitPlusOne;

            const trimmedEpisodes = hasMore ? episodes.slice(0, limit) : episodes;

            return { episodes: trimmedEpisodes, hasMore };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Error finding episode');
        }
    }

    public async handleGetEpisodes(
        limit: number,
        premium: boolean,
        start_date: Date,
        end_date: Date,
        last_id: string,
        release_date: EMovieSort,
    ): Promise<{ episodes: EpisodeDocument[]; hasMore: boolean }> {
        try {
            const query: FilterQuery<EpisodeDocument> = {};

            if (start_date && end_date) {
                query.release_date = { $gte: start_date, $lte: end_date };
            }

            if (typeof premium === 'boolean') {
                query.premium = premium;
            }

            const sort: Record<string, SortOrder> = {};
            const sortField: keyof EpisodeDocument = 'release_date';
            const sortDirection: SortOrder = release_date ?? EMovieSort.DESC;

            sort[sortField] = sortDirection;
            sort._id = sortDirection;

            if (last_id) {
                const lastEpisode = await this.episodeRepository.findEpisodeById(last_id, [sortField], true);
                if (lastEpisode) {
                    query.$or = [
                        { [sortField]: { [sortDirection === 1 ? '$gt' : '$lt']: lastEpisode[sortField] } },
                        {
                            [sortField]: lastEpisode[sortField],
                            _id: { [sortDirection === 1 ? '$gt' : '$lt']: lastEpisode._id },
                        },
                    ];
                }
            }

            const limitPlusOne = limit + 1;

            const episodes = await this.episodeRepository.findEpisodes(
                query,
                limitPlusOne,
                [
                    'overview_id',
                    'season_id',
                    'title',
                    'description',
                    'episode_number',
                    'duration',
                    'release_date',
                    'img',
                    'premium',
                    'count_view',
                    'count_comment',
                    'count_like',
                    'count_dislike',
                    'created_at',
                    'updated_at',
                ],
                sort,
            );

            const hasMore = episodes.length === limitPlusOne;

            const trimmedEpisodes = hasMore ? episodes.slice(0, limit) : episodes;

            return { episodes: trimmedEpisodes, hasMore };
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to retrieve episodes', error });
        }
    }

    public async handleGetEpisodesCount(): Promise<number> {
        return this.episodeRepository.countDocuments({});
    }
}
