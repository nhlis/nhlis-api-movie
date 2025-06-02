import { ArrayNotEmpty, IsArray, IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EAgeRating, EMovieGenre, EMovieType, EMovieLanguage, EMovieSort } from '../../../../common';

export class QueryOverviewIdsDto {
    @Transform(
        ({ value }) => {
            return value.split(/[\s,]+/).filter(Boolean);
        },
        { toClassOnly: true },
    )
    @IsArray()
    ids: string[];
}

export class QueryOverviewsDto {
    @IsString()
    @IsOptional()
    last_id: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => (value ? Number(value) : 50))
    limit: number = 50;

    @IsOptional()
    @Transform(
        ({ value }) => {
            return value.split(/[\s,]+/).filter(Boolean);
        },
        { toClassOnly: true },
    )
    @IsArray({ message: 'The "genre" parameter is required and must be an array' })
    @ArrayNotEmpty({ message: 'The "genre" parameter cannot be empty' })
    @IsEnum(EMovieGenre, { each: true, message: 'Each value in must be a valid' })
    @Transform(({ value }) => value.map((v) => String(v)))
    genres: EMovieGenre[];

    @IsOptional()
    @IsEnum(EMovieType)
    @Type(() => String)
    type: EMovieType;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    start_date: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    end_date: Date;

    @IsOptional()
    @IsEnum(EAgeRating)
    @Type(() => Number)
    age_rating: EAgeRating;

    @IsOptional()
    @Transform(({ value }) => value.map((v) => String(v)))
    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(EMovieLanguage, { each: true })
    subtitle_languages: EMovieLanguage[];

    @IsOptional()
    @Transform(({ value }) => value.map((v) => String(v)))
    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(EMovieLanguage, { each: true })
    dub_languages: EMovieLanguage[];

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    release_date: EMovieSort;

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    most_rated: EMovieSort;

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    highest_rated: EMovieSort;

    @IsOptional()
    @IsEnum(EMovieSort)
    @Type(() => Number)
    most_viewed: EMovieSort;
}
