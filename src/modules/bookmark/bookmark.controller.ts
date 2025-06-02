import { Controller, Get, Post, Delete, Query, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { IUser, User, AuthGuard, IOverviewRespone, BuildUrlImg } from '../../common';
import { QueryBookmarkDto } from './dtos/query-bookmark.dto';
import { PostBookmarkDto } from './dtos/post-bookmark.dto';
import { BookmarkService } from './bookmark.service';
import { BookmarkDocument } from './bookmark.schema';

@Controller('bookmarks')
export class BookmarkController {
    constructor(private readonly bookmarkService: BookmarkService) {}

    // For api client user

    @UseGuards(AuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async postBookmark(@User() user: IUser, @Body() body: PostBookmarkDto): Promise<{ bookmark: BookmarkDocument }> {
        const bookmark = await this.bookmarkService.handlePostBookmark({ profile_id: user.sub, overview_id: body.overview_id });

        return { bookmark };
    }

    @UseGuards(AuthGuard)
    @Delete(':overview_id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteBookmark(@User() user: IUser, @Param('overview_id') overview_id: string): Promise<void> {
        await this.bookmarkService.handleDeleteBookmark(user.sub, overview_id);
    }

    @UseGuards(AuthGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    async getBookmarks(@User() user: IUser, @Query() query: QueryBookmarkDto): Promise<{ overviews: IOverviewRespone[]; hasMore: boolean }> {
        const { bookmarks, hasMore } = await this.bookmarkService.handleGetBookmarks(user.sub, query.limit, query.last_id, query.created_at);

        return {
            overviews: bookmarks.map((overview: IOverviewRespone) => {
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
            hasMore,
        };
    }

    // =========================================================================
}
