import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EAccountTitle } from 'src/common/enums/account/title.account.enum';

@Schema({ _id: false })
export class Profile {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: Boolean, default: true })
    active: boolean;

    @Prop({
        type: Number,
        default: 0,
    })
    experience: number;

    @Prop({ type: Boolean, default: false })
    partner: boolean;

    @Prop({ type: Boolean, default: false })
    premium: boolean;

    @Prop({ type: [Number], enum: EAccountTitle, default: [EAccountTitle.NEWBIE] })
    titles: EAccountTitle[];

    @Prop({ type: [Date], default: () => [new Date()] })
    interaction_history: Date[];

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type ProfileDocument = HydratedDocument<Profile>;

export const ProfileSchema = SchemaFactory.createForClass(Profile);
