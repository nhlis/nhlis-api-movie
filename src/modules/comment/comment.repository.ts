import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';

import { Comment, CommentDocument } from './comment.schema';
import { BaseRepository } from '../shared/repositories/base.repository';
import { IdService } from '../shared/services/id.service';
import { EMovieSort } from 'src/common';

@Injectable()
export class CommentRepository extends BaseRepository<CommentDocument> {
    private readonly logger = new Logger(CommentRepository.name);

    constructor(
        @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
        private readonly idService: IdService,
    ) {
        super(commentModel);
    }

    // ===== WRITE METHODS =====
    public async createComment(
        payload: {
            profile_id: string;
            episode_id: string;
            text: string;
            parent_id: string;
            reply_id: string;
            reply_profile_id: string;
        },
        session: ClientSession,
    ): Promise<CommentDocument> {
        return this.createDocument(
            {
                _id: this.idService.handleGenerateId(),
                profile_id: payload.profile_id,
                episode_id: payload.episode_id,
                text: payload.text,
                parent_id: payload.parent_id,
                reply_id: payload.reply_id,
                reply_profile_id: payload.reply_profile_id,
                created_at: new Date(),
            },
            session,
        );
    }

    // ===== UPDATE METHODS =====
    public async updateCommentByIdAndUser(comment_id: string, profile_id: string, payload: { text: string }, session: ClientSession): Promise<CommentDocument> {
        return this.findOneAndUpdate({ _id: comment_id, profile_id }, { ...payload, is_edit: true, updated_at: new Date() }, { upsert: false, new: true }, session);
    }

    // ===== INCREMENT METHODS =====
    public async incrementCommentStats(
        comment_id: string,
        payload: {
            count_child?: number;
            count_like?: number;
            count_dislike?: number;
        },
        session?: ClientSession,
    ): Promise<void> {
        const inc: any = {};
        const set: any = { updated_at: new Date() };

        if (payload.count_child) inc.count_child = payload.count_child;
        if (payload.count_like) inc.count_like = payload.count_like;
        if (payload.count_dislike) inc.count_dislike = payload.count_dislike;

        await this.commentModel.updateOne({ _id: comment_id }, { $inc: inc, $set: set }, { session });
    }

    // ===== DELETE METHODS =====
    public async deleteCommentByIdAndUser(
        comment_id: string,
        profile_id: string,
        session: ClientSession,
    ): Promise<{
        insertedCount: number;
        matchedCount: number;
        modifiedCount: number;
        deletedCount: number;
        upsertedCount: number;
        upsertedIds: Record<string, any>;
        insertedIds: Record<string, any>;
    }> {
        const comment = await this.findDocument({ _id: comment_id, profile_id }, ['parent_id'], true);

        const bulkOps = [];

        if (comment?.parent_id) {
            bulkOps.push({
                updateOne: {
                    filter: { _id: comment.parent_id },
                    update: { $inc: { count_child: -1 } },
                },
            });
        }

        bulkOps.push({
            deleteOne: {
                filter: { _id: comment_id, profile_id },
            },
        });

        bulkOps.push({
            deleteMany: {
                filter: { parent_id: comment_id },
            },
        });

        return this.commentModel.bulkWrite(bulkOps, { session });
    }

    // ===== READ METHODS =====
    public async findCommentById(comment_id: string, fields: Array<keyof Comment>, lean: boolean): Promise<Partial<CommentDocument>> {
        return this.findDocument({ _id: comment_id }, fields, lean);
    }

    public async findComments(query: FilterQuery<Comment> = {}, limit: number, fields: Array<keyof Comment>, sort: Record<string, SortOrder>): Promise<CommentDocument[]> {
        return this.findDocuments(query, limit, fields, sort, true);
    }

    public async findCommentsByUser(profile_id: string, limit: number, last_id: string, fields: Array<keyof Comment>, sort: Record<string, SortOrder>): Promise<CommentDocument[]> {
        const queryBuilder: FilterQuery<Comment> = { profile_id };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }
}
