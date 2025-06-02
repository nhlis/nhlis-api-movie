import { Controller, Post, Get, Delete, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { SearchHistoryService } from './search-history.service';
import { SearchHistoryDocument } from './search-history.schema';
import { IUser, User, AuthGuard, IResponeSeachHistory, OptionalAuthGuard } from '../../common';
import { QuerySearchHistoryDto } from './dtos/query-search-history.dto';
import { PostSearchHistoryDto } from './dtos/post-search-history.dto';
import { QueryOverviewIdsDto } from '../movies/overview/dtos/query-overview.dto';

@UseGuards(AuthGuard)
@Controller('search-history')
export class SearchHistoryController {
    constructor(private readonly searchHistoryService: SearchHistoryService) {}

    // For api client user

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async createSearchHistory(@User() user: IUser, @Body() body: PostSearchHistoryDto): Promise<{ search_history: SearchHistoryDocument }> {
        const search_history = await this.searchHistoryService.handlePostSearchHistory({
            profile_id: user.sub,
            overview_id: body.overview_id,
        });

        return { search_history };
    }

    @UseGuards(OptionalAuthGuard)
    @Get()
    @HttpCode(HttpStatus.OK)
    public async getSearchHistories(@User() user: IUser, @Query() query: QuerySearchHistoryDto): Promise<{ search_histories: IResponeSeachHistory[]; hasMore: boolean }> {
        const { search_histories, hasMore } = await this.searchHistoryService.handleGetSearchHistories(user.sub, query.limit, query.last_id);

        return { search_histories, hasMore };
    }

    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteSearchHistory(@User() user: IUser, @Query() query: QueryOverviewIdsDto): Promise<void> {
        return this.searchHistoryService.handleDeleteSearchHistory(user.sub, query.ids);
    }

    // =======================================================
}
