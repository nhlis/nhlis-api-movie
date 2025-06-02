import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EEntityType, EReactionType } from '../../common';

@Schema({ _id: false })
export class Reaction {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, required: true, index: true })
    profile_id: string;

    @Prop({ type: String, enum: EEntityType, required: true, index: true })
    entity_type: EEntityType;

    @Prop({ type: String, required: true, index: true })
    entity_id: string;

    @Prop({ type: String, enum: EReactionType, required: true, index: true })
    reaction_type: EReactionType;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type ReactionDocument = HydratedDocument<Reaction>;

export const ReactionSchema = SchemaFactory.createForClass(Reaction);
