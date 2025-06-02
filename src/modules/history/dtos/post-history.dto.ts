import { IsNotEmpty, IsString } from 'class-validator';

export class PostHistoryDto {
    @IsNotEmpty()
    @IsString()
    overview_id: string;

    @IsNotEmpty()
    @IsString()
    episode_id: string;
}
