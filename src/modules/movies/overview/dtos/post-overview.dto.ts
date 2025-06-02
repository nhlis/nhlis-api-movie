import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DateTime } from 'luxon';

import { EMovieGenre, EMovieType, EMovieLanguage, EAgeRating } from '../../../../common';

export class PostOverviewDto {
    @IsNotEmpty({ message: 'Original title is required.' })
    @IsString({ message: 'Original title must be a string.' })
    original_title: string;

    @IsNotEmpty({ message: 'Description is required.' })
    @IsString({ message: 'Description must be a string.' })
    description: string;

    @ArrayNotEmpty({ message: 'Genre must contain at least one value.' })
    @IsArray({ message: 'Genre must be an array.' })
    @IsEnum(EMovieGenre, { each: true, message: 'Each genre must be a valid EMovieGenre value.' })
    @Transform(({ value }) => value.map((v) => String(v)))
    genres: EMovieGenre[];

    @IsNotEmpty({ message: 'Type is required.' })
    @IsEnum(EMovieType, { message: 'Type must be a valid EMovieType value.' })
    @Type(() => String)
    type: EMovieType;

    @IsNotEmpty({ message: 'Release date is required.' })
    @IsDate({ message: 'Release date must be a valid date.' })
    @Transform(({ value }) => {
        return DateTime.fromJSDate(value).toUTC().toJSDate();
    })
    @Type(() => Date)
    release_date: Date;

    @IsOptional()
    @IsArray({ message: 'Subtitles must be an array.' })
    @ArrayNotEmpty({ message: 'Subtitles must contain at least one language.' })
    @IsEnum(EMovieLanguage, { each: true, message: 'Each subtitle must be a valid EMovieLanguage value.' })
    @Transform(({ value }) => value.map((v) => String(v)))
    subtitle_languages: EMovieLanguage[];

    @IsOptional()
    @IsArray({ message: 'Dubtitles must be an array.' })
    @ArrayNotEmpty({ message: 'Dubtitles must contain at least one language.' })
    @IsEnum(EMovieLanguage, { each: true, message: 'Each dubtitle must be a valid EMovieLanguage value.' })
    @Transform(({ value }) => value.map((v) => String(v)))
    dub_languages: EMovieLanguage[];

    @IsNotEmpty()
    @IsEnum(EAgeRating, { message: 'Type must be a valid EAgeRating value.' })
    @Type(() => Number)
    age_rating: EAgeRating;

    // =======================

    @IsOptional()
    @IsArray({ message: 'Another title must be an array.' })
    alternative_titles: string[];
}
