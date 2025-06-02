import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, FilterQuery, Model, SortOrder } from 'mongoose';

import { Reaction, ReactionDocument } from './reaction.schema';
import { BaseRepository } from '../../modules/shared/repositories/base.repository';
import { EEntityType, EMovieSort, EReactionType } from '../../common';
import { IdService } from '../../modules/shared/services/id.service';

@Injectable()
export class ReactionRepository extends BaseRepository<ReactionDocument> {
    private readonly logger = new Logger(ReactionRepository.name);

    constructor(
        @InjectModel(Reaction.name) private readonly reactionModel: Model<ReactionDocument>,
        private readonly idService: IdService,
    ) {
        super(reactionModel);
    }

    // ===== WRITE METHODS =====
    public async createReaction(payload: { profile_id: string; entity_id: string; entity_type: EEntityType; reaction_type: EReactionType }): Promise<Partial<ReactionDocument>> {
        return this.findOneAndUpdate(
            { profile_id: payload.profile_id, entity_id: payload.entity_id, entity_type: payload.entity_type },
            {
                $setOnInsert: {
                    _id: this.idService.handleGenerateId(),
                    profile_id: payload.profile_id,
                    entity_id: payload.entity_id,
                    entity_type: payload.entity_type,
                    created_at: new Date(),
                },
                $set: { reaction_type: payload.reaction_type, updated_at: new Date() },
            },
            { new: true, upsert: true },
        );
    }

    // ===== DELETE METHODS =====
    public async deleteReactionById(reactionId: string, session?: ClientSession): Promise<ReactionDocument> {
        return this.findOneAndDelete({ _id: reactionId }, session);
    }

    public async deleteReactionsByProfile(profile_id: string, session?: ClientSession): Promise<{ acknowledged: boolean; deletedCount: number }> {
        return this.deleteDocument({ profile_id: profile_id }, session);
    }

    public async deleteReaction(profile_id: string, entity_id: string, entity_type: EEntityType, reaction_type: EReactionType, session?: ClientSession): Promise<ReactionDocument> {
        return this.findOneAndDelete({ profile_id, entity_id, entity_type, reaction_type }, session);
    }

    // ===== READ METHODS =====
    public async findReactionsByEntity(entity_type: EEntityType, limit: number, last_id: string, fields: Array<keyof Reaction>, sort: Record<string, SortOrder>): Promise<Partial<ReactionDocument>[]> {
        const queryBuilder: FilterQuery<Reaction> = { entity_type };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort);
    }

    public async findReactionsByProfile(profile_id: string, limit: number, last_id: string, fields: Array<keyof Reaction>, sort: Record<string, SortOrder>): Promise<Partial<ReactionDocument>[]> {
        const queryBuilder: FilterQuery<Reaction> = { profile_id };
        if (last_id) queryBuilder._id = sort.release_date === EMovieSort.ASC ? { $gt: last_id } : { $lt: last_id };
        return this.findDocuments(queryBuilder, limit, fields, sort, true);
    }

    public async findReactionsByProfileAndEntityIdsAndEntityType(
        entity_ids: string[],
        profile_id: string,
        entity_type: EEntityType,
        fields: Array<keyof Reaction>,
        sort: Record<string, SortOrder>,
    ): Promise<ReactionDocument[]> {
        const queryBuilder: FilterQuery<Reaction> = { profile_id, entity_type, entity_id: { $in: entity_ids } };
        return this.findDocuments(queryBuilder, 0, fields, sort, true);
    }

    public async findReactionByProfileAndEntityIdAndEntityType(
        profile_id: string,
        entity_id: string,
        entity_type: EEntityType,
        fields: Array<keyof Reaction>,
        lean: boolean,
    ): Promise<Partial<ReactionDocument>> {
        return this.findDocument({ profile_id, entity_id, entity_type }, fields, lean);
    }
}
