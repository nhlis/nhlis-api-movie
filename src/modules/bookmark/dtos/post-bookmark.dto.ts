import { IsNotEmpty, IsString } from 'class-validator';

export class PostBookmarkDto {
    @IsNotEmpty()
    @IsString()
    overview_id: string;
}
