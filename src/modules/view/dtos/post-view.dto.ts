import { IsNotEmpty, IsString } from 'class-validator';

export class PostViewDto {
    @IsNotEmpty()
    @IsString()
    overview_id: string;

    @IsNotEmpty()
    @IsString()
    episode_id: string;

    @IsNotEmpty()
    @IsString()
    visitor_id: string;
}
