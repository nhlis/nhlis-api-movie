import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ENotificationType } from '../../common';

@Schema({ _id: false })
export class Notification {
    @Prop({ type: String })
    _id: string;

    @Prop({ type: String, required: true })
    profile_id: string;

    @Prop({ type: String, enum: ENotificationType, required: true })
    type: ENotificationType;

    @Prop({ type: String, required: false })
    type_id: string;

    @Prop({ default: false })
    is_read: boolean;

    @Prop({ type: Date, default: () => new Date(), index: true })
    created_at: Date;

    @Prop({ type: Date, default: () => new Date(), index: true })
    updated_at: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;

export const NotificationSchema = SchemaFactory.createForClass(Notification);
