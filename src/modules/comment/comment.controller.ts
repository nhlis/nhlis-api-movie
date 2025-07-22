import { Controller, UseGuards, Post, Body, Param, Get, Query, Delete, Patch, HttpStatus, HttpCode, UsePipes, ValidationPipe } from '@nestjs/common';

import { AuthGuard, OptionalAuthGuard, ICommentRespone, IUser, User } from '../../common';

import { CommentService } from './comment.service';
import { PostCommentDto } from './dtos/post-comment.dto';
import { QueryCommentDto } from './dtos/query-comment.dto';
import { CommentDocument } from './comment.schema';
import { PatchCommentDto } from './dtos/patch-comment.dto';
import { SanitizeTextPipe } from 'src/common/pipes/sanitize-text.pipe';

@Controller('comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    // For api client user

    @UseGuards(AuthGuard)
    @Post()
    @UsePipes(ValidationPipe, SanitizeTextPipe)
    @HttpCode(HttpStatus.CREATED)
    async postComment(@User() user: IUser, @Body() body: PostCommentDto): Promise<{ comment: Partial<ICommentRespone> }> {
        const comment = await this.commentService.handlePostComment({
            profile_id: user.sub,
            episode_id: body.episode_id,
            text: body.text,
            parent_id: body.parent_id,
            reply_id: body.reply_id,
            reply_profile_id: body.reply_profile_id,
        });

        return { comment };
    }

    @UseGuards(AuthGuard)
    @Patch(':comment_id')
    @UsePipes(ValidationPipe, SanitizeTextPipe)
    @HttpCode(HttpStatus.OK)
    async patchComment(@Param('comment_id') comment_id: string, @User() user: IUser, @Body() body: PatchCommentDto): Promise<{ comment: Partial<ICommentRespone> }> {
        const comment = await this.commentService.handlePatchComment(comment_id, user.sub, body.text);

        return { comment };
    }

    @UseGuards(AuthGuard)
    @Delete(':comment_id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(@User() user: IUser, @Param('comment_id') comment_id: string): Promise<void> {
        await this.commentService.handleDeleteComment(comment_id, user.sub);
    }

    @UseGuards(OptionalAuthGuard)
    @Get('episode/:episode_id')
    @HttpCode(HttpStatus.OK)
    async getCommentsByEpisode(@User() user: IUser, @Param('episode_id') episode_id: string, @Query() query: QueryCommentDto): Promise<{ comments: Partial<ICommentRespone>[]; hasMore: boolean }> {
        const { comments, hasMore } = await this.commentService.handleGetCommentsByEpisode(user.sub, episode_id, query.limit, query.last_id, query.created_at);

        return { comments, hasMore };
    }

    @UseGuards(OptionalAuthGuard)
    @Get('child/:comment_id')
    @HttpCode(HttpStatus.OK)
    async getChildComments(@User() user: IUser, @Param('comment_id') comment_id: string, @Query() query: QueryCommentDto): Promise<{ comments: Partial<ICommentRespone>[]; hasMore: boolean }> {
        const { comments, hasMore } = await this.commentService.handleGetChildComments(user.sub, comment_id, query.limit, query.last_id, query.created_at);

        return { comments, hasMore };
    }

    // =============================================================================================================

    @UseGuards(AuthGuard)
    @Get('user')
    @HttpCode(HttpStatus.OK)
    async getCommentsByUser(@User() user: IUser, @Query() query: QueryCommentDto): Promise<CommentDocument[]> {
        return this.commentService.handleGetCommentsByUser(user.sub, query.limit, query.last_id, query.created_at);
    }
}
