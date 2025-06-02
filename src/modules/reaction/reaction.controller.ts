import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ReactionService } from './reaction.service';
import { ReactionDocument } from './reaction.schema';
import { IUser, User, AuthGuard } from '../../common';
import { PostReactionDto } from './dtos/post-reaction.dto';
import { QueryEntity, QueryReactionByEntityDto, QueryReactionDto } from './dtos/query-reaction.dto';

@Controller('reactions')
export class ReactionController {
    constructor(private readonly reactionService: ReactionService) {}

    // For api client user

    @UseGuards(AuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async createReaction(@User() user: IUser, @Body() body: PostReactionDto): Promise<{ reaction: Partial<ReactionDocument> }> {
        const reaction = await this.reactionService.handlePostReaction({
            profile_id: user.sub,
            entity_id: body.entity_id,
            entity_type: body.entity_type,
            reaction_type: body.reaction_type,
        });

        return { reaction };
    }

    @UseGuards(AuthGuard)
    @Delete(':entity_id')
    @HttpCode(HttpStatus.NO_CONTENT)
    public async deleteReaction(@User() user: IUser, @Param('entity_id') entity_id: string, @Query() query: QueryEntity): Promise<void> {
        await this.reactionService.handleDeleteReactionByEntity(user.sub, entity_id, query.entity_type, query.reaction_type);
    }

    /// =============================================================================================================================

    @Get()
    @HttpCode(HttpStatus.OK) // 200 OK
    public async getReactions(@Query() query: QueryReactionByEntityDto): Promise<Partial<ReactionDocument>[]> {
        return this.reactionService.handleGetReactionsByEntity(query.entity_type, query.limit, query.last_id, query.created_at);
    }

    @UseGuards(AuthGuard)
    @Get('user')
    @HttpCode(HttpStatus.OK) // 200 OK
    public async getReactionsByProfile(@User() user: IUser, @Query() query: QueryReactionDto): Promise<Partial<ReactionDocument>[]> {
        return this.reactionService.handleGetReactionsByProfile(user.sub, query.limit, query.last_id, query.created_at);
    }

    @UseGuards(AuthGuard)
    @Delete('user')
    @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content (Xóa thành công)
    public async deleteReactionsByProfile(@User() user: IUser): Promise<void> {
        return this.reactionService.handleDeleteReactionsByProfile(user.sub);
    }
}
