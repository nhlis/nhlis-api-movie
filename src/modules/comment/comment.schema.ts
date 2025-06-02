import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Comment {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, index: true, required: true })
    profile_id: string;

    @Prop({
        type: String,
        required: true,
        index: true,
    })
    episode_id: string;

    @Prop({ type: String, required: true })
    text: string;

    @Prop({
        type: String,
        index: true,
    })
    parent_id: string;

    @Prop({ type: String, index: true })
    reply_id: string;

    @Prop({ type: String, index: true })
    reply_profile_id: string;

    @Prop({ type: Boolean, default: false })
    is_edit: boolean;

    @Prop({ type: Number, default: 0, index: true })
    count_child: number;

    @Prop({ type: Number, default: 0, index: true })
    count_like: number;

    @Prop({ type: Number, default: 0, index: true })
    count_dislike: number;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type CommentDocument = HydratedDocument<Comment>;

export const CommentSchema = SchemaFactory.createForClass(Comment);
