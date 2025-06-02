import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

import { SeasonService } from './season.service';
import { SeasonDocument } from './season.schema';
import { QuerySeasonDto } from './dtos/query-season.dto';
import { PostSeasonDto } from './dtos/post-season.dto';
import { PatchSeasonDto } from './dtos/patch-season.dto';
import { AuthGuard, EAccountRoles, Roles, RolesGuard } from '../../../common';

@Controller('seasons')
export class SeasonController {
    constructor(private readonly seasonService: SeasonService) {}

    // For api client user

    @Get('overview/:overview_id')
    public async getSeasonsByOverview(@Param('overview_id') overview_id: string, @Query() query: QuerySeasonDto): Promise<{ seasons: SeasonDocument[] }> {
        const seasons = await this.seasonService.handleGetSeasonsByOverview(overview_id, query.limit, query.last_id, query.created_at);

        return { seasons };
    }

    // =================================================================

    @UseGuards(AuthGuard, RolesGuard)
    @Roles(EAccountRoles.SUPER_ADMIN, EAccountRoles.ADMIN)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async postSeason(@Body() body: PostSeasonDto): Promise<Partial<SeasonDocument>> {
        return this.seasonService.handlePostSeason({ overview_id: body.overview_id, name: body.name });
    }

    @Patch(':season_id')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async updateSeason(@Param('season_id') season_id: string, @Body() body: PatchSeasonDto): Promise<void> {
        return this.seasonService.handlePatchSeason(season_id, { overview_id: body.overview_id, name: body.name });
    }

    @Get()
    public async getSeasons(@Query() query: QuerySeasonDto): Promise<SeasonDocument[]> {
        return this.seasonService.handleGetSeasons(query.limit, query.last_id, query.created_at);
    }

    @Delete(':season_id')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteSeason(@Param('season_id') season_id: string): Promise<void> {
        return this.seasonService.handleDeleteSeason(season_id);
    }
}
