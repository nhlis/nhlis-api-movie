import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { EpisodeService } from './episode.service';
import { BuildUrlImg, BuildUrlStream, EAccountRoles, FileSizeValidator, FileTypeValidator, IUser, Roles, RolesGuard, User, IEpisodeResponse, AuthGuard, OptionalAuthGuard } from '../../../common';
import { PostEpisodeDto } from './dtos/post-episode.dto';
import { PatchEpisodeDto } from './dtos/patch-episode.dto';
import { QueryEpisodeDto } from './dtos/query-episode.dto';
import { EpisodeDocument } from './episode.schema';

@Controller('episodes')
export class EpisodeController {
    constructor(private readonly episodeService: EpisodeService) {}

    // For api client user

    @Get('season/:season_id')
    @HttpCode(HttpStatus.OK)
    public async getEpisodesBySeason(@Param('season_id') season_id: string, @Query() query: QueryEpisodeDto): Promise<{ episodes: Partial<EpisodeDocument>[]; hasMore: boolean }> {
        const { episodes, hasMore } = await this.episodeService.handleGetEpisodesBySeason(season_id, query.limit, query.last_id, query.release_date);

        return {
            episodes: episodes.map((episode) => ({
                ...episode,
                img: BuildUrlImg(episode.img),
            })),
            hasMore,
        };
    }

    @UseGuards(OptionalAuthGuard)
    @Get('context/:episode_id')
    @HttpCode(HttpStatus.OK)
    public async getEpisodesInContext(
        @User() user: IUser,
        @Param('episode_id') episode_id: string,
    ): Promise<{ episodes: { previous?: Partial<IEpisodeResponse>; current: Partial<IEpisodeResponse>; next?: Partial<IEpisodeResponse> } }> {
        const episodes = await this.episodeService.handleGetEpisodesInContext(user.sub, episode_id);

        return {
            episodes: {
                previous: episodes.previous
                    ? {
                          ...episodes.previous,
                          img: BuildUrlImg(episodes.previous.img),
                      }
                    : undefined,
                current: {
                    ...episodes.current,
                    img: BuildUrlImg(episodes.current.img),
                },
                next: episodes.next
                    ? {
                          ...episodes.next,
                          img: BuildUrlImg(episodes.next.img),
                      }
                    : undefined,
            },
        };
    }

    @UseGuards(OptionalAuthGuard)
    @Get(':episode_id')
    @HttpCode(HttpStatus.OK)
    public async getURLByEpisodeId(@User() user: IUser, @Param('episode_id') episode_id: string): Promise<{ uri: string }> {
        const { uri } = await this.episodeService.handleGetURLByEpisodeId(user.sub, episode_id);

        return {
            uri: BuildUrlStream(uri),
        };
    }

    // ======================================================================================================

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN, EAccountRoles.ADMIN)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('imgSrc'))
    public async postEpisode(
        @Body() body: PostEpisodeDto,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileSizeValidator({
                        multiple: false,
                        maxSizeBytes: 5 * 1024 * 1024,
                    }),
                    new FileTypeValidator({
                        multiple: false,
                        filetype: /^image\/(jpeg|png)$/i,
                    }),
                ],
                fileIsRequired: true,
            }),
        )
        imgSrc: Express.Multer.File,
    ): Promise<EpisodeDocument> {
        return this.episodeService.handlePostEpisode(
            {
                overview_id: body.overview_id,
                season_id: body.season_id,
                title: body.title,
                description: body.description,
                episode_number: body.episode_number,
                duration: body.duration,
                release_date: body.release_date,
                premium: body.premium,
                uri: body.uri,
            },
            { imgSrc },
        );
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN, EAccountRoles.ADMIN)
    @Patch(':episode_id')
    @HttpCode(HttpStatus.ACCEPTED)
    @UseInterceptors(FileInterceptor('imgSrc'))
    public async patchEpisode(
        @Param('episode_id') episode_id: string,
        @Body() body: PatchEpisodeDto,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new FileSizeValidator({
                        multiple: false,
                        maxSizeBytes: 5 * 1024 * 1024,
                    }),
                    new FileTypeValidator({
                        multiple: false,
                        filetype: /^image\/(jpeg|png)$/i,
                    }),
                ],
                fileIsRequired: false,
            }),
        )
        imgSrc?: Express.Multer.File,
    ): Promise<EpisodeDocument> {
        return this.episodeService.handlePatchEpisode(
            episode_id,
            {
                overview_id: body.overview_id,
                season_id: body.season_id,
                title: body.title,
                description: body.description,
                episode_number: body.episode_number,
                duration: body.duration,
                release_date: body.release_date,
                premium: body.premium,
                uri: body.uri,
            },
            { imgSrc },
        );
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN, EAccountRoles.ADMIN)
    @Delete(':episode_id')
    @HttpCode(HttpStatus.ACCEPTED)
    public async deleteEpisode(@Param('episode_id') episode_id: string): Promise<void> {
        return this.episodeService.handleDeleteEpisode(episode_id);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    public async getEpisodes(@Query() query: QueryEpisodeDto): Promise<{ episodes: Partial<EpisodeDocument>[]; hasMore: boolean }> {
        const { episodes, hasMore } = await this.episodeService.handleGetEpisodes(query.limit, query.premium, query.start_date, query.end_date, query.last_id, query.release_date);
        return {
            episodes: episodes.map((episode) => ({
                ...episode,
                img: BuildUrlImg(episode.img),
            })),
            hasMore,
        };
    }
}
