import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ENotificationType } from '../../../common';
import { Type } from 'class-transformer';

export class PostNotificationDto {
    @IsNotEmpty()
    @IsEnum(ENotificationType)
    @Type(() => String)
    type: ENotificationType;

    @IsNotEmpty()
    @IsString()
    type_id: string;
}
