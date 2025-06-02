import { IsNotEmpty, IsString } from 'class-validator';

export class PostSeasonDto {
    @IsNotEmpty()
    @IsString()
    overview_id: string;

    @IsNotEmpty()
    @IsString()
    name: string;
}
