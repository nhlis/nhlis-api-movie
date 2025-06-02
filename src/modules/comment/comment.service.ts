import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FilterQuery, SortOrder } from 'mongoose';

import { CommentDocument } from './comment.schema';
import { AccountTitleMapping, EEntityType, EMovieSort, EReactionType, ICommentRespone, IAccountResponse } from '../../common';
import { CommentRepository } from './comment.repository';
import { ProfileRepository } from '../../modules/profile/profile.repository';
import { EpisodeRepository } from '../../modules/movies/episode/episode.repository';
import { ReactionDocument } from '../reaction/reaction.schema';
import { ReactionRepository } from '../reaction/reaction.repository';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CommentService {
    private auth_base_url: string;

    constructor(
        private readonly commentRepository: CommentRepository,
        private readonly episodeRepository: EpisodeRepository,
        private readonly reactionRepository: ReactionRepository,
        private readonly profileRepository: ProfileRepository,
        private readonly configService: ConfigService,
    ) {
        this.auth_base_url = this.configService.get<string>('AUTH_BASE_URL');
    }

    public async handlePostComment(payload: {
        profile_id: string;
        episode_id: string;
        text: string;
        parent_id: string;
        reply_id: string;
        reply_profile_id: string;
    }): Promise<Partial<ICommentRespone>> {
        try {
            const [profile, episode] = await Promise.all([
                this.profileRepository.findProfileById(payload.profile_id, ['_id', 'experience', 'titles'], true),
                this.episodeRepository.findEpisodeById(payload.episode_id, ['_id'], true),
            ]);

            if (!profile) throw new NotFoundException({ message: 'Profile not found' });
            if (!episode) throw new NotFoundException({ message: 'Episode not found' });

            const titles =
                profile?.titles
                    ?.sort((a, b) => a - b)
                    .map((t) => AccountTitleMapping[t])
                    .filter(Boolean) || [];

            if (!payload.parent_id) {
                await this.episodeRepository.incrementEpisodeStats(episode._id, { count_comment: 1 });
                const comment = await this.commentRepository.createComment(
                    { profile_id: profile._id, episode_id: episode._id, text: payload.text, parent_id: undefined, reply_id: undefined, reply_profile_id: undefined },
                    undefined,
                );

                return { ...comment, ...profile, _id: comment._id, titles: titles };
            }

            const parentComment = await this.commentRepository.findCommentById(payload.parent_id, ['_id', 'profile_id'], true);
            if (!parentComment) throw new NotFoundException('Parent comment not found');

            if (!payload.reply_id) {
                const comment = await this.commentRepository.createComment(
                    { profile_id: profile._id, episode_id: episode._id, text: payload.text, parent_id: parentComment._id, reply_id: undefined, reply_profile_id: undefined },
                    undefined,
                );

                await this.commentRepository.incrementCommentStats(parentComment._id, { count_child: 1 });
                await this.episodeRepository.incrementEpisodeStats(episode._id, { count_comment: 1 });

                return { ...comment, ...profile, _id: comment._id, titles: titles };
            }

            const replyComment = await this.commentRepository.findCommentById(payload.reply_id, ['_id'], true);
            if (!replyComment) throw new NotFoundException('Reply comment not found');

            const profile_reply = await this.profileRepository.findProfileById(payload.reply_profile_id, ['_id'], true);
            if (!profile_reply) throw new NotFoundException({ message: 'Profile reply not found' });

            const comment = await this.commentRepository.createComment(
                { profile_id: profile._id, episode_id: episode._id, text: payload.text, parent_id: parentComment._id, reply_id: replyComment._id, reply_profile_id: profile_reply._id },
                undefined,
            );

            await this.commentRepository.incrementCommentStats(parentComment._id, { count_child: 1 });
            await this.episodeRepository.incrementEpisodeStats(episode._id, { count_comment: 1 });

            return { ...comment, ...profile, _id: comment._id, titles: titles };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException({ message: 'Failed to save comment', error: error.message });
        }
    }

    public async handleGetCommentsByEpisode(
        profile_id: string,
        episode_id: string,
        limit: number,
        last_id: string,
        created_at: EMovieSort,
    ): Promise<{ comments: ICommentRespone[]; hasMore: boolean }> {
        try {
            const query: FilterQuery<CommentDocument> = {
                episode_id,
                parent_id: { $exists: false },
                reply_id: { $exists: false },
            };

            // Sorting
            const sort: Record<string, SortOrder> = { created_at: EMovieSort.DESC };
            const sortField: keyof CommentDocument = 'created_at';
            const sortDirection: SortOrder = created_at; // Sử dụng từ client gửi lên

            // Secondary sort by _id for stable pagination
            sort._id = sortDirection;

            // Nếu có phân trang thì thêm điều kiện theo last_id
            if (last_id) {
                const lastComment = await this.commentRepository.findCommentById(last_id, [sortField], true);

                if (lastComment) {
                    const op: '$gt' | '$lt' = sortDirection === 1 ? '$gt' : '$lt';

                    query.$or = [
                        { [sortField]: { [op]: lastComment[sortField] } },
                        {
                            [sortField]: lastComment[sortField],
                            _id: { [op]: lastComment._id },
                        },
                    ];
                }
            }

            const limitPlusOne = limit + 1;

            const comments = await this.commentRepository.findComments(
                query,
                limitPlusOne,
                ['_id', 'profile_id', 'episode_id', 'text', 'parent_id', 'reply_id', 'count_child', 'count_like', 'count_dislike', 'is_edit', 'created_at', 'updated_at'],
                sort,
            );

            const hasMore = comments.length === limitPlusOne;

            const trimmedComments = hasMore ? comments.slice(0, limit) : comments;

            const profileIds = trimmedComments.map((comment) => comment.profile_id);

            const idsParam = profileIds.join(' ');
            const params: any = { ids: idsParam };

            const res = await axios.get(this.auth_base_url + '/accounts/arr', { params });

            const profiles = await this.profileRepository.findProfilesByIds(profileIds, ['experience', 'partner', 'titles'], {});

            const profileMap = new Map(profiles.map((p) => [p._id.toString(), p]));

            const accountMap = new Map(res.data.data.accounts.map((p) => [p._id.toString(), p]));

            const commentIds = trimmedComments.map((comment) => comment._id);

            let reactionEpisdoeIds: ReactionDocument[] = [];

            if (profile_id) {
                reactionEpisdoeIds = await this.reactionRepository.findReactionsByProfileAndEntityIdsAndEntityType(commentIds, profile_id, EEntityType.COMMENT, ['entity_id', 'reaction_type'], {});
            }

            const likeSet = new Set(reactionEpisdoeIds.filter((r) => r.reaction_type === EReactionType.LIKE).map((r) => r.entity_id.toString()));

            const dislikeSet = new Set(reactionEpisdoeIds.filter((r) => r.reaction_type === EReactionType.DISLIKE).map((r) => r.entity_id.toString()));

            const leanComments = trimmedComments as unknown as ICommentRespone[];

            const enrichedComments = leanComments.map((comment) => {
                const rawProfile = profileMap.get(comment.profile_id.toString());
                const rawAccount = accountMap.get(comment.profile_id.toString()) as IAccountResponse;

                const titles =
                    rawProfile?.titles
                        ?.sort((a, b) => a - b)
                        .map((t) => AccountTitleMapping[t])
                        .filter(Boolean) || [];

                return {
                    ...comment,
                    ...(likeSet.has(comment._id.toString()) && { is_like: true }),
                    ...(dislikeSet.has(comment._id.toString()) && { is_dislike: true }),
                    experience: rawProfile?.experience ?? null,
                    partner: rawProfile?.partner ?? false,
                    titles,
                    first_name: rawAccount?.first_name ?? null,
                    last_name: rawAccount?.last_name ?? null,
                    img: rawAccount?.img ?? null,
                };
            });

            return { comments: enrichedComments, hasMore };
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to retrieve comments' });
        }
    }

    public async handleGetChildComments(
        profile_id: string,
        parent__comment_id: string,
        limit: number,
        last_id: string,
        created_at: EMovieSort,
    ): Promise<{ comments: ICommentRespone[]; hasMore: boolean }> {
        try {
            const query: FilterQuery<CommentDocument> = {
                parent_id: parent__comment_id,
                _id: { $ne: parent__comment_id },
            };

            // Sorting
            const sort: Record<string, SortOrder> = {};
            const sortField: keyof CommentDocument = 'created_at';
            const sortDirection: SortOrder = created_at; // Sử dụng từ client gửi lên

            // Secondary sort by _id for stable pagination
            sort._id = sortDirection;

            // Nếu có phân trang thì thêm điều kiện theo last_id
            if (last_id) {
                const lastComment = await this.commentRepository.findCommentById(last_id, [sortField], true);

                if (lastComment) {
                    const op: '$gt' | '$lt' = sortDirection === 1 ? '$gt' : '$lt';

                    query.$or = [
                        { [sortField]: { [op]: lastComment[sortField] } },
                        {
                            [sortField]: lastComment[sortField],
                            _id: { [op]: lastComment._id },
                        },
                    ];
                }
            }

            const limitPlusOne = limit + 1;

            const comments = await this.commentRepository.findComments(
                query,
                limitPlusOne,
                ['_id', 'profile_id', 'episode_id', 'text', 'parent_id', 'reply_id', 'reply_profile_id', 'count_child', 'count_like', 'count_dislike', 'is_edit', 'created_at', 'updated_at'],
                sort,
            );

            const hasMore = comments.length === limitPlusOne;

            const trimmedComments = hasMore ? comments.slice(0, limit) : comments;

            const allProfileIds = Array.from(new Set(trimmedComments.flatMap((c) => [c.profile_id, c.reply_profile_id]).filter(Boolean)));

            const idsParam = allProfileIds.join(' ');
            const params: any = { ids: idsParam };

            const res = await axios.get(this.auth_base_url + '/accounts/arr', { params });

            const profiles = await this.profileRepository.findProfilesByIds(allProfileIds, ['experience', 'partner', 'titles'], {});

            const profileMap = new Map(profiles.map((p) => [p._id.toString(), p]));

            const accountMap = new Map(res.data.data.accounts.map((p) => [p._id.toString(), p]));

            const commentIds = trimmedComments.map((comment) => comment._id);

            let reactionEpisdoeIds: ReactionDocument[] = [];

            if (profile_id) {
                reactionEpisdoeIds = await this.reactionRepository.findReactionsByProfileAndEntityIdsAndEntityType(commentIds, profile_id, EEntityType.COMMENT, ['entity_id', 'reaction_type'], {});
            }

            const likeSet = new Set(reactionEpisdoeIds.filter((r) => r.reaction_type === EReactionType.LIKE).map((r) => r.entity_id.toString()));

            const dislikeSet = new Set(reactionEpisdoeIds.filter((r) => r.reaction_type === EReactionType.DISLIKE).map((r) => r.entity_id.toString()));

            const leanComments = trimmedComments as unknown as ICommentRespone[];

            const enrichedComments = leanComments.map((comment) => {
                const rawProfile = profileMap.get(comment.profile_id);
                const rawAccountReply = accountMap.get(comment.reply_profile_id) as IAccountResponse;
                const rawAccount = accountMap.get(comment.profile_id) as IAccountResponse;

                const titles =
                    rawProfile?.titles
                        ?.sort((a, b) => a - b)
                        .map((t) => AccountTitleMapping[t])
                        .filter(Boolean) || [];

                return {
                    ...comment,
                    ...(likeSet.has(comment._id) && { is_like: true }),
                    ...(dislikeSet.has(comment._id) && { is_dislike: true }),
                    experience: rawProfile?.experience ?? null,
                    partner: rawProfile?.partner ?? false,
                    titles,
                    first_name: rawAccount?.first_name ?? null,
                    last_name: rawAccount?.last_name ?? null,
                    img: rawAccount?.img ?? null,
                    ...(rawAccountReply?.first_name && { reply_first_name: rawAccountReply?.first_name }),
                    ...(rawAccountReply?.last_name && { reply_last_name: rawAccountReply?.last_name }),
                };
            });

            return { comments: enrichedComments, hasMore };
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to retrieve comments' });
        }
    }

    public async handleGetCommentsByUser(profile_id: string, limit: number, last_id: string, created_at: EMovieSort): Promise<CommentDocument[]> {
        try {
            const sortQuery: { [key: string]: SortOrder } = {
                created_at: Object.values(EMovieSort).includes(created_at) ? created_at : EMovieSort.DESC,
            };
            return this.commentRepository.findCommentsByUser(
                profile_id,
                limit,
                last_id,
                ['_id', 'profile_id', 'episode_id', 'text', 'parent_id', 'reply_id', 'count_child', 'count_like', 'count_dislike', 'created_at', 'updated_at'],
                sortQuery,
            );
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to retrieve comments' });
        }
    }

    public async handlePatchComment(comment_id: string, profile_id: string, text: string): Promise<CommentDocument> {
        try {
            return this.commentRepository.updateCommentByIdAndUser(comment_id, profile_id, { text }, undefined);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof InternalServerErrorException) throw error;
            throw new InternalServerErrorException({ message: 'Error updating comment', error: error.message });
        }
    }

    public async handleDeleteComment(comment_id: string, profile_id: string): Promise<void> {
        const comment = await this.commentRepository.findCommentById(comment_id, ['_id', 'episode_id', 'parent_id'], true);
        const { deletedCount } = await this.commentRepository.deleteCommentByIdAndUser(comment_id, profile_id, undefined);
        await this.episodeRepository.incrementEpisodeStats(comment.episode_id, { count_comment: -deletedCount });
        if (deletedCount === 0) throw new NotFoundException({ message: 'Comment not found or not owned by user' });
    }
}
