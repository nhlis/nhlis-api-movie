import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Rating {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, required: true, index: true })
    profile_id: string;

    @Prop({ type: String, required: true, index: true })
    overview_id: string;

    @Prop({ type: Number, required: true, min: 1, max: 5 })
    point: number;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type RatingDocument = HydratedDocument<Rating>;

export const RatingSchema = SchemaFactory.createForClass(Rating);

RatingSchema.index({ profile_id: 1, overview_id: 1 }, { unique: true });
