import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class History {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, index: true })
    profile_id: string;

    @Prop({ type: String, required: true, index: true })
    overview_id: string;

    @Prop({ type: String, required: true, index: true })
    episode_id: string;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type HistoryDocument = HydratedDocument<History>;

export const HistorySchema = SchemaFactory.createForClass(History);

HistorySchema.index({ profile_id: 1, episode_id: 1 }, { unique: true, sparse: true });
