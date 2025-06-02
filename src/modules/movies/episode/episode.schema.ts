import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Episode {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, required: true, index: true })
    overview_id: string;

    @Prop({ type: String, required: true, index: true })
    season_id: string;

    @Prop({ type: String })
    title: string;

    @Prop({ type: String })
    description: string;

    @Prop({ type: Number, index: true })
    episode_number: number;

    @Prop({ type: Number, required: true })
    duration: number;

    @Prop({ type: Date, required: true, index: true })
    release_date: Date;

    @Prop({ type: String })
    img: string;

    @Prop({ type: Boolean, required: true, default: false })
    premium: boolean;

    @Prop({ type: String, required: true, unique: true })
    uri: string;

    @Prop({ type: Number, default: 0, index: true })
    count_view: number;

    @Prop({ type: Number, default: 0, index: true })
    count_comment: number;

    @Prop({ type: Number, default: 0, index: true })
    count_like: number;

    @Prop({ type: Number, default: 0, index: true })
    count_dislike: number;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type EpisodeDocument = HydratedDocument<Episode>;

export const EpisodeSchema = SchemaFactory.createForClass(Episode);

EpisodeSchema.index({ season_id: 1, episode_number: 1 }, { unique: true });
