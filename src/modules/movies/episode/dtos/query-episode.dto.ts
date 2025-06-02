import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DateTime } from 'luxon';
import { EMovieSort } from '../../../../common';

export class QueryEpisodeDto {
    @IsOptional()
    @IsInt()
    @Min(20)
    @Max(100)
    @Transform(({ value }) => (value ? Number(value) : 50))
    limit: number;

    @IsOptional()
    @IsString()
    last_id: string;

    @IsOptional()
    @IsDate()
    @Transform(({ value }) => {
        return DateTime.fromJSDate(value).toUTC().toJSDate();
    })
    @Type(() => Date)
    start_date: Date;

    @IsOptional()
    @IsDate()
    @Transform(({ value }) => {
        return DateTime.fromJSDate(value).toUTC().toJSDate();
    })
    @Type(() => Date)
    end_date: Date;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => JSON.parse(value))
    premium: boolean;

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    release_date: EMovieSort;
}
