import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { EMovieGenre, EMovieType, EMovieLanguage, EAgeRating } from '../../../../common';
import { DateTime } from 'luxon';

export class PatchOverviewDto {
    @IsOptional()
    @IsString()
    original_title: string;

    @IsOptional()
    @IsArray({ message: 'Another title must be an array.' })
    @ArrayNotEmpty()
    alternative_titles: string[];

    @IsOptional()
    @IsString()
    description: string;

    @IsOptional()
    @IsArray({ message: 'Genre must be an array.' })
    @IsEnum(EMovieGenre, { each: true, message: 'Each genre must be a valid EMovieGenre value.' })
    @Transform(({ value }) => value.map((v) => String(v)))
    genres: EMovieGenre[];

    @IsOptional()
    @IsEnum(EMovieType, { message: 'Type must be a valid EMovieType value.' })
    @Type(() => String)
    type: EMovieType;

    @IsOptional()
    @IsDate()
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

    @IsOptional()
    @IsEnum(EAgeRating, { message: 'Type must be a valid EAgeRating value.' })
    @Type(() => Number)
    age_rating: EAgeRating;
}
