import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DateTime } from 'luxon';

export class PatchEpisodeDto {
    @IsOptional()
    @IsString()
    overview_id: string;

    @IsOptional()
    @IsString()
    season_id: string;

    @IsOptional()
    @IsString({ message: 'Title must be a string.' })
    title: string;

    @IsOptional()
    @IsString({ message: 'Description must be a string.' })
    description: string;

    @IsOptional()
    @IsInt()
    @Transform(({ value }) => Number(value))
    episode_number: number;

    @IsOptional()
    @IsInt()
    @Transform(({ value }) => Number(value))
    duration: number;

    @IsOptional()
    @IsDate()
    @Transform(({ value }) => {
        return DateTime.fromJSDate(value).toUTC().toJSDate();
    })
    @Type(() => Date)
    release_date: Date;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => JSON.parse(value))
    premium: boolean;

    @IsOptional()
    @IsString({ message: 'Uri must be a string.' })
    uri: string;
}
