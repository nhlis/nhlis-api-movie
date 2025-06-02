import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EEntityType, EReactionType } from '../../../common';
import { Type } from 'class-transformer';

export class PostReactionDto {
    @IsNotEmpty()
    @IsString()
    entity_id: string;

    @IsNotEmpty()
    @IsEnum(EEntityType)
    @Type(() => String)
    entity_type: EEntityType;

    @IsNotEmpty()
    @IsEnum(EReactionType)
    @Type(() => String)
    reaction_type: EReactionType;
}
