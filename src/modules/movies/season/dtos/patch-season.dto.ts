import { IsOptional, IsString } from 'class-validator';

export class PatchSeasonDto {
    @IsOptional()
    @IsString()
    overview_id: string;

    @IsOptional()
    @IsString()
    name: string;
}
