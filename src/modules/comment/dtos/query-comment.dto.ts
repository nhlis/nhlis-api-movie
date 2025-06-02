import { Transform, Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { EMovieSort } from '../../../common';

export class QueryCommentDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => (value ? Number(value) : 50))
    limit: number;

    @IsOptional()
    @IsString()
    last_id: string;

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    created_at: EMovieSort;
}
