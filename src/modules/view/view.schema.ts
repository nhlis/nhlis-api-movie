import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class View {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, index: true })
    visitor_id: string;

    @Prop({ type: String, required: true, index: true })
    overview_id: string;

    @Prop({ type: String, required: true, index: true })
    episode_id: string;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;
}

export type ViewDocument = HydratedDocument<View>;

export const ViewSchema = SchemaFactory.createForClass(View);
