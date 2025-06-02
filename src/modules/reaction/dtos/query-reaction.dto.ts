import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EEntityType, EMovieSort, EReactionType } from '../../../common';

export class QueryReactionDto {
    @IsOptional()
    @IsString()
    last_id: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => (value ? Number(value) : 50))
    limit: number = 50;

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    created_at: EMovieSort;
}

export class QueryReactionByEntityDto {
    @IsNotEmpty()
    @IsEnum(EEntityType)
    @Type(() => String)
    entity_type: EEntityType;

    @IsOptional()
    @IsString()
    last_id: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => (value ? Number(value) : 50))
    limit: number = 50;

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    created_at: EMovieSort;
}

export class QueryEntity {
    @IsNotEmpty()
    @IsEnum(EEntityType)
    @Type(() => String)
    entity_type: EEntityType;

    @IsNotEmpty()
    @IsEnum(EReactionType)
    @Type(() => String)
    reaction_type: EReactionType;
}
