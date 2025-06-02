import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Season {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, required: true, index: true })
    overview_id: string;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: Number, default: 0, index: true })
    count_episode: number;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type SeasonDocument = HydratedDocument<Season>;

export const SeasonSchema = SchemaFactory.createForClass(Season);
