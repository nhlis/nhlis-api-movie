import { IsNotEmpty, IsString } from 'class-validator';

export class PostSearchHistoryDto {
    @IsNotEmpty()
    @IsString()
    overview_id: string;
}
