import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EMovieSort } from '../../../common';

export class QueryProfileDto {
    @IsString()
    @IsOptional()
    last_id: string;

    @IsOptional()
    @IsInt()
    @Min(20)
    @Max(100)
    @Transform(({ value }) => (value ? Number(value) : 50))
    limit: number = 50;

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    created_at: EMovieSort;
}
