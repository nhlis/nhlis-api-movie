import { IsNotEmpty, IsString } from 'class-validator';

export class SearchOverviewDto {
    @IsString()
    @IsNotEmpty()
    keyword: string;
}
