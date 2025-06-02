import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EMovieLanguage, EMovieGenre, EMovieType } from '../../../common';

@Schema({ _id: false })
export class Overview {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, required: true })
    original_title: string;

    @Prop({ type: [String] })
    alternative_titles: string[];

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: [String], enum: EMovieGenre, index: true })
    genres: EMovieGenre[];

    @Prop({ type: String, enum: EMovieType, index: true })
    type: EMovieType;

    @Prop({ type: Date, required: true, index: true })
    release_date: Date;

    @Prop({ type: String, required: true })
    logo: string;

    @Prop({ type: String, required: true })
    poster: string;

    @Prop({ type: String, required: true })
    backdrop: string;

    @Prop({ type: [String], default: [], enum: EMovieLanguage, index: true })
    subtitle_languages: EMovieLanguage[];

    @Prop({ type: [String], default: [], enum: EMovieLanguage, index: true })
    dub_languages: EMovieLanguage[];

    @Prop({ type: Number, default: 14, index: true })
    age_rating: number;

    @Prop({ type: Number, default: 0, index: true })
    total_rating: number;

    @Prop({ type: Number, default: 0, index: true })
    count_rating: number;

    @Prop({ type: Number, default: 0, index: true })
    average_rating: number;

    @Prop({ type: Number, default: 0, index: true })
    count_season: number;

    @Prop({ type: Number, default: 0, index: true })
    count_episode: number;

    @Prop({ type: Number, default: 0, index: true })
    count_view: number;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type OverviewDocument = HydratedDocument<Overview>;

export const OverviewSchema = SchemaFactory.createForClass(Overview);
