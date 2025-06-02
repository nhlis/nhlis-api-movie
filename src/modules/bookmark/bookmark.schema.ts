import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class Bookmark {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, required: true, index: true })
    profile_id: string;

    @Prop({ type: String, required: true, index: true })
    overview_id: string;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type BookmarkDocument = HydratedDocument<Bookmark>;

export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);
