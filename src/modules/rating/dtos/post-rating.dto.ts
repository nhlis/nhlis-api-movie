import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class PostRatingDto {
    @IsNotEmpty()
    @IsString()
    overview_id: string;

    @IsInt()
    @Min(1)
    @Max(5)
    point: number;
}
