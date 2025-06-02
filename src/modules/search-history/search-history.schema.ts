import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class SearchHistory {
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

export type SearchHistoryDocument = HydratedDocument<SearchHistory>;

export const SearchHistorySchema = SchemaFactory.createForClass(SearchHistory);
