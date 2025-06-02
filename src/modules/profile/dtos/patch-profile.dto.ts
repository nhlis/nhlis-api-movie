import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { EAccountTitle } from 'src/common/enums/account/title.account.enum';

export class PatchProfileDto {
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    active: boolean;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    experience: number;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    partner: boolean;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    premium: boolean;

    @IsOptional()
    @IsEnum(EAccountTitle)
    @Type(() => Number)
    title: EAccountTitle[];
}
