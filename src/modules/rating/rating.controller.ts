import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingDocument } from './rating.schema';
import { AuthGuard, IUser, User } from '../../common';
import { QueryRatingDto } from './dtos/query-rating.dto';
import { PostRatingDto } from './dtos/post-rating.dto';

@Controller('ratings')
export class RatingController {
    constructor(private readonly ratingService: RatingService) {}

    // For api client user

    @UseGuards(AuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async createRating(@User() user: IUser, @Body() body: PostRatingDto): Promise<{ rating: RatingDocument }> {
        const rating = await this.ratingService.handlePostRating({ profile_id: user.sub, overview_id: body.overview_id, point: body.point });

        return { rating };
    }

    @UseGuards(AuthGuard)
    @Delete('overview/:overview_id')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteRating(@User() user: IUser, @Param('overview_id') overview_id: string): Promise<void> {
        await this.ratingService.handleDeleteRating(user.sub, overview_id);
    }

    // =============================================================

    @Get()
    @HttpCode(HttpStatus.OK)
    public async getRatings(@Query() query: QueryRatingDto): Promise<RatingDocument[]> {
        return this.ratingService.handleGetRatings(query.limit, query.last_id, query.created_at);
    }

    @UseGuards(AuthGuard)
    @Get('user')
    @HttpCode(HttpStatus.OK)
    public async getRatingsByProfile(@User() user: IUser, @Query() query: QueryRatingDto): Promise<RatingDocument[]> {
        return this.ratingService.handleGetRatingsByProfile(user.sub, query.limit, query.last_id, query.created_at);
    }

    @UseGuards(AuthGuard)
    @Delete('user')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteRatingsByProfile(@User() user: IUser): Promise<void> {
        return this.ratingService.handleDeleteRatingsByProfile(user.sub);
    }

    @Get('overview/:overview_id/average')
    @HttpCode(HttpStatus.OK)
    public async getAverageRatingByOverview(@Param('overview_id') overview_id: string): Promise<{ ratingCounts: number; average: number }> {
        return this.ratingService.handleGetAverageRatingByOverviewId(overview_id);
    }
}
