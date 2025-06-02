import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { AuthGuard, BuildUrlImg, EAccountRoles, FileSizeValidator, FileTypeValidator, IUser, Roles, RolesGuard, User, IOverviewRespone, OptionalAuthGuard } from '../../../common';

import { OverviewService } from './overview.service';
import { PostOverviewDto } from './dtos/post-overview.dto';
import { PatchOverviewDto } from './dtos/patch-overview.dto';
import { QueryOverviewIdsDto, QueryOverviewsDto } from './dtos/query-overview.dto';
import { OverviewDocument } from './overview.schema';
import { SearchOverviewDto } from './dtos/search-overview.dto';

@Controller('overviews')
export class OverviewController {
    constructor(private readonly overviewService: OverviewService) {}

    // For api client user

    @UseGuards(OptionalAuthGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    public async getOverviews(@User() user: IUser, @Query() query: QueryOverviewsDto): Promise<{ overviews: Partial<IOverviewRespone>[]; hasMore: boolean }> {
        const { overviews, hasMore } = await this.overviewService.handleGetOverviews(user.sub, {
            genres: query.genres,
            type: query.type,
            start_date: query.start_date,
            end_date: query.end_date,
            limit: query.limit,
            last_id: query.last_id,
            subtitle_languages: query.subtitle_languages,
            dub_languages: query.dub_languages,
            age_rating: query.age_rating,
            release_date: query.release_date,
            most_rated: query.most_rated,
            highest_rated: query.highest_rated,
            most_viewed: query.most_viewed,
        });

        return {
            overviews: overviews.map((overview: IOverviewRespone) => {
                return {
                    _id: overview._id,
                    original_title: overview.original_title,
                    alternative_titles: overview.alternative_titles,
                    description: overview.description,
                    genres: overview.genres,
                    type: overview.type,
                    release_date: overview.release_date,
                    subtitle_languages: overview.subtitle_languages,
                    dub_languages: overview.dub_languages,
                    logo: BuildUrlImg(overview.logo),
                    poster: BuildUrlImg(overview.poster),
                    backdrop: BuildUrlImg(overview.backdrop),
                    age_rating: overview.age_rating,
                    total_rating: overview.total_rating,
                    count_rating: overview.count_rating,
                    average_rating: overview.average_rating,
                    count_season: overview.count_season,
                    count_episode: overview.count_episode,
                    count_view: overview.count_view,
                    is_bookmark: overview.is_bookmark,
                    created_at: overview.created_at,
                    updated_at: overview.updated_at,
                };
            }),
            hasMore,
        };
    }

    @UseGuards(OptionalAuthGuard)
    @Get('arr')
    @HttpCode(HttpStatus.OK)
    public async getInfoOverviewByIds(@User() user: IUser, @Query() query: QueryOverviewIdsDto): Promise<{ overviews: Partial<IOverviewRespone>[] }> {
        const overviews = await this.overviewService.handleGetOverviewByIds(user.sub, query.ids);

        return {
            overviews: overviews.map((overview: IOverviewRespone) => {
                return {
                    _id: overview._id,
                    original_title: overview.original_title,
                    alternative_titles: overview.alternative_titles,
                    description: overview.description,
                    genres: overview.genres,
                    type: overview.type,
                    release_date: overview.release_date,
                    subtitle_languages: overview.subtitle_languages,
                    dub_languages: overview.dub_languages,
                    logo: BuildUrlImg(overview.logo),
                    poster: BuildUrlImg(overview.poster),
                    backdrop: BuildUrlImg(overview.backdrop),
                    age_rating: overview.age_rating,
                    total_rating: overview.total_rating,
                    count_rating: overview.count_rating,
                    average_rating: overview.average_rating,
                    count_season: overview.count_season,
                    count_episode: overview.count_episode,
                    count_view: overview.count_view,
                    is_bookmark: overview.is_bookmark,
                    rating_point: overview.rating_point,
                    created_at: overview.created_at,
                    updated_at: overview.updated_at,
                };
            }),
        };
    }

    @UseGuards(OptionalAuthGuard)
    @Get('search')
    @HttpCode(HttpStatus.OK)
    public async searchOverview(@User() user: IUser, @Query() query: SearchOverviewDto): Promise<{ overviews: Partial<IOverviewRespone>[] }> {
        try {
            const overviews = await this.overviewService.handleSearchOverviews(user.sub, query.keyword);

            return {
                overviews: overviews.map((overview: IOverviewRespone) => {
                    return {
                        _id: overview._id,
                        original_title: overview.original_title,
                        alternative_titles: overview.alternative_titles,
                        description: overview.description,
                        genres: overview.genres,
                        type: overview.type,
                        release_date: overview.release_date,
                        subtitle_languages: overview.subtitle_languages,
                        dub_languages: overview.dub_languages,
                        logo: BuildUrlImg(overview.logo),
                        poster: BuildUrlImg(overview.poster),
                        backdrop: BuildUrlImg(overview.backdrop),
                        age_rating: overview.age_rating,
                        total_rating: overview.total_rating,
                        count_rating: overview.count_rating,
                        average_rating: overview.average_rating,
                        count_season: overview.count_season,
                        count_episode: overview.count_episode,
                        count_view: overview.count_view,
                        is_bookmark: overview.is_bookmark,
                        created_at: overview.created_at,
                        updated_at: overview.updated_at,
                    };
                }),
            };
        } catch (error) {
            throw error;
        }
    }

    // ==================================================================================================

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN, EAccountRoles.ADMIN)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'logoSrc', maxCount: 1 },
            { name: 'posterSrc', maxCount: 1 },
            { name: 'backdropSrc', maxCount: 1 },
        ]),
    )
    public async postOverview(
        @Body() body: PostOverviewDto,
        @UploadedFiles(
            new ParseFilePipe({
                validators: [new FileSizeValidator({ multiple: true, maxSizeBytes: 20 * 1024 * 1024 }), new FileTypeValidator({ multiple: true, filetype: /^image\/(jpeg|png)$/i })],
            }),
        )
        files: { logoSrc: Express.Multer.File[]; posterSrc: Express.Multer.File[]; backdropSrc: Express.Multer.File[] },
    ): Promise<{ overview: OverviewDocument }> {
        const overview = await this.overviewService.handlePostOverview(
            {
                original_title: body.original_title,
                description: body.description,
                genres: body.genres,
                type: body.type,
                release_date: body.release_date,
                subtitle_languages: body.subtitle_languages,
                dub_languages: body.dub_languages,
                alternative_titles: body.alternative_titles,
                age_rating: body.age_rating,
            },
            { logoSrc: files.logoSrc[0], posterSrc: files.posterSrc[0], backdropSrc: files.backdropSrc[0] },
        );

        return { overview };
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN, EAccountRoles.ADMIN)
    @Patch(':overview_id')
    @HttpCode(HttpStatus.ACCEPTED)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'logoSrc', maxCount: 1 },
            { name: 'posterSrc', maxCount: 1 },
            { name: 'backdropSrc', maxCount: 1 },
        ]),
    )
    public async patchOverview(
        @Param('overview_id') overview_id: string,
        @Body() body: PatchOverviewDto,
        @UploadedFiles(
            new ParseFilePipe({
                validators: [new FileSizeValidator({ multiple: true, maxSizeBytes: 20 * 1024 * 1024 }), new FileTypeValidator({ multiple: true, filetype: /^image\/(jpeg|png)$/i })],
                fileIsRequired: false,
            }),
        )
        files?: { logoSrc: Express.Multer.File[]; posterSrc: Express.Multer.File[]; backdropSrc: Express.Multer.File[] },
    ): Promise<OverviewDocument> {
        return this.overviewService.handlePatchOverview(
            overview_id,
            {
                original_title: body.original_title,
                description: body.description,
                genres: body.genres,
                type: body.type,
                release_date: body.release_date,
                subtitle_languages: body.subtitle_languages,
                dub_languages: body.dub_languages,
                alternative_titles: body.alternative_titles,
                age_rating: body.age_rating,
            },
            {
                logoSrc: files?.logoSrc?.[0],
                posterSrc: files?.posterSrc?.[0],
                backdropSrc: files?.backdropSrc?.[0],
            },
        );
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN, EAccountRoles.ADMIN)
    @Delete(':overview_id')
    @HttpCode(HttpStatus.ACCEPTED)
    public async deleteOverview(@Param('overview_id') overview_id: string): Promise<void> {
        await this.overviewService.handleDeleteOverview(overview_id);
    }

    @Get('count')
    public async getOverviewCount(): Promise<{ totalRecords: number }> {
        const totalRecords = await this.overviewService.handleGetOverviewCount();
        return { totalRecords };
    }
}
