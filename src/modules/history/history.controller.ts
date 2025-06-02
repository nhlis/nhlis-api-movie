import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, UseGuards, Delete, Param } from '@nestjs/common';
import { HistoryService } from './history.service';
import { AuthGuard, BuildUrlImg, IUser, User, IHistoryRespone } from '../../common';
import { PostHistoryDto } from './dtos/post-history.dto';
import { QueryHistoryDto } from './dtos/query-history.dto';

@UseGuards(AuthGuard)
@Controller('histories')
export class HistoryController {
    constructor(private readonly viewService: HistoryService) {}

    // For api client user

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async createOrUpdateView(@User() user: IUser, @Body() body: PostHistoryDto): Promise<void> {
        await this.viewService.handleCreateOrUpdateHistory({ profile_id: user.sub, overview_id: body.overview_id, episode_id: body.episode_id });
    }

    @Delete('/:id')
    @HttpCode(HttpStatus.OK)
    public async deleteEpisodeInHistory(@User() user: IUser, @Param('id') id: string): Promise<void> {
        await this.viewService.handleDeleteEpisodeInHistory(user.sub, id);
    }

    @Delete()
    @HttpCode(HttpStatus.OK)
    public async clearHistories(@User() user: IUser): Promise<void> {
        await this.viewService.handleClearHistories(user.sub);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    public async getViewsByProfile(@User() user: IUser, @Query() query: QueryHistoryDto): Promise<{ histories: IHistoryRespone[]; hasMore: boolean }> {
        const { histories, hasMore } = await this.viewService.handleGetHistoriesByProfile(user.sub, query.limit, query.last_id);

        return {
            histories: histories.map((h) => ({
                ...h,
                episode_img: BuildUrlImg(h.episode_img),
            })),
            hasMore,
        };
    }

    // =======================================================================================
}
