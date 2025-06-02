import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EMovieSort } from '../../../common';

export class QueryBookmarkDto {
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
