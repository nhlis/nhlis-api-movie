import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EMovieSort } from '../../../common';

export class QueryNotificationDto {
    @IsOptional()
    @IsInt()
    @Min(10)
    @Max(100)
    @Transform(({ value }) => (value ? Number(value) : 50))
    limit: number;

    @IsOptional()
    @IsString()
    last_id: string;

    @IsOptional()
    @IsEnum(EMovieSort)
    release_date: EMovieSort;
}
