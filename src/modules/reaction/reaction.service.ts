import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientSession, SortOrder } from 'mongoose';

import { ReactionRepository } from './reaction.repository';
import { ReactionDocument } from './reaction.schema';
import { EEntityType, EMovieSort, EReactionType } from '../../common';
import { CommentRepository } from '../comment/comment.repository';
import { EpisodeRepository } from '../../modules/movies/episode/episode.repository';

@Injectable()
export class ReactionService {
    constructor(
        private readonly reactionRepository: ReactionRepository,
        private readonly commentRepository: CommentRepository,
        private readonly episodeRepository: EpisodeRepository,
    ) {}

    public async handleGetReactionsByEntity(entity_type: EEntityType, limit: number, last_id: string, created_at: EMovieSort): Promise<Partial<ReactionDocument>[]> {
        const sortQuery: { [key: string]: SortOrder } = {
            created_at: Object.values(EMovieSort).includes(created_at) ? created_at : EMovieSort.DESC,
        };
        return this.reactionRepository.findReactionsByEntity(entity_type, limit, last_id, ['_id', 'profile_id', 'entity_type', 'entity_id', 'reaction_type', 'created_at'], sortQuery);
    }

    public async handlePostReaction(payload: { profile_id: string; entity_id: string; entity_type: EEntityType; reaction_type: EReactionType }): Promise<Partial<ReactionDocument>> {
        if (!Object.values(EReactionType).includes(payload.reaction_type)) {
            throw new NotFoundException({ message: 'Invalid reaction type' });
        }

        // Kiểm tra entity tồn tại
        const validationPromises: Promise<any>[] = [];

        if (payload.entity_type === EEntityType.COMMENT) {
            validationPromises.push(this.commentRepository.findCommentById(payload.entity_id, ['_id'], true));
        }

        if (payload.entity_type === EEntityType.EPISODE) {
            validationPromises.push(this.episodeRepository.findEpisodeById(payload.entity_id, ['_id'], true));
        }

        const results = await Promise.all(validationPromises);
        if (results.some((result) => !result)) {
            throw new NotFoundException({ message: `${payload.entity_type} not found` });
        }

        // Kiểm tra reaction hiện tại (nếu có)
        const existingReaction = await this.reactionRepository.findReactionByProfileAndEntityIdAndEntityType(payload.profile_id, payload.entity_id, payload.entity_type, ['reaction_type'], true);

        const isNewReaction = !existingReaction;
        const isReactionChanged = existingReaction && existingReaction.reaction_type !== payload.reaction_type;

        // Chỉ update stats nếu là tạo mới hoặc đổi loại reaction
        if (isNewReaction) {
            // Tăng 1 cho loại mới
            const statsField = payload.reaction_type === EReactionType.LIKE ? { count_like: 1 } : { count_dislike: 1 };

            if (payload.entity_type === EEntityType.COMMENT) {
                await this.commentRepository.incrementCommentStats(payload.entity_id, statsField);
            }

            if (payload.entity_type === EEntityType.EPISODE) {
                await this.episodeRepository.incrementEpisodeStats(payload.entity_id, statsField);
            }
        }

        if (isReactionChanged) {
            // Giảm 1 cho loại cũ
            const decreaseField = payload.reaction_type === EReactionType.DISLIKE ? { count_like: -1 } : { count_dislike: -1 };

            // Tăng 1 cho loại mới
            const increaseField = payload.reaction_type === EReactionType.LIKE ? { count_like: 1 } : { count_dislike: 1 };

            if (payload.entity_type === EEntityType.COMMENT) {
                await this.commentRepository.incrementCommentStats(payload.entity_id, decreaseField);
                await this.commentRepository.incrementCommentStats(payload.entity_id, increaseField);
            }

            if (payload.entity_type === EEntityType.EPISODE) {
                await this.episodeRepository.incrementEpisodeStats(payload.entity_id, decreaseField);
                await this.episodeRepository.incrementEpisodeStats(payload.entity_id, increaseField);
            }
        }

        // Tạo hoặc cập nhật reaction
        const reaction = await this.reactionRepository.createReaction(payload);
        return reaction;
    }

    public async handleDeleteReactionByEntity(profile_id: string, entity_id: string, entity_type: EEntityType, reaction_type: EReactionType, session?: ClientSession): Promise<void> {
        const reaction = await this.reactionRepository.deleteReaction(profile_id, entity_id, entity_type, reaction_type, session);

        if (!reaction) return;

        const inc = { [reaction.reaction_type === EReactionType.LIKE ? 'count_like' : 'count_dislike']: -1 };

        if (reaction.entity_type === EEntityType.COMMENT) {
            await this.commentRepository.incrementCommentStats(reaction.entity_id, inc);
        } else if (reaction.entity_type === EEntityType.EPISODE) {
            await this.episodeRepository.incrementEpisodeStats(reaction.entity_id, inc);
        }
    }

    public async handleGetReactionsByProfile(profile_id: string, limit: number, last_id: string, created_at: EMovieSort): Promise<Partial<ReactionDocument>[]> {
        const sortQuery: { [key: string]: SortOrder } = {
            created_at: Object.values(EMovieSort).includes(created_at) ? created_at : EMovieSort.DESC,
        };
        return this.reactionRepository.findReactionsByProfile(profile_id, limit, last_id, ['_id', 'profile_id', 'entity_type', 'entity_id', 'reaction_type', 'created_at'], sortQuery);
    }

    public async handleDeleteReactionsByProfile(profile_id: string): Promise<void> {
        const { acknowledged, deletedCount } = await this.reactionRepository.deleteReactionsByProfile(profile_id);
        if (deletedCount === 0) throw new NotFoundException('No reactions found for this profile');
        if (!acknowledged) throw new InternalServerErrorException('Failed to delete reactions');
    }
}
