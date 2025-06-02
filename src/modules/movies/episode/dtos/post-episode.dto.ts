import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DateTime } from 'luxon';

export class PostEpisodeDto {
    @IsNotEmpty()
    @IsString()
    overview_id: string;

    @IsNotEmpty()
    @IsString()
    season_id: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Title is required.' })
    @IsString({ message: 'Title must be a string.' })
    title: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Description is required.' })
    @IsString({ message: 'Description must be a string.' })
    description: string;

    @IsOptional()
    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    episode_number: number;

    @IsNotEmpty()
    @IsInt()
    @Type(() => Number)
    duration: number;

    @IsNotEmpty()
    @IsDate()
    @Transform(({ value }) => {
        return DateTime.fromJSDate(value).toUTC().toJSDate();
    })
    @Type(() => Date)
    release_date: Date;

    @IsNotEmpty()
    @IsBoolean()
    @Transform(({ value }) => JSON.parse(value))
    premium: boolean;

    @IsNotEmpty({ message: 'Uri is required.' })
    @IsString({ message: 'Uri must be a string.' })
    uri: string;
}
