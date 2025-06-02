import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryHistoryDto {
    @IsString()
    @IsOptional()
    last_id: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Transform(({ value }) => (value ? Number(value) : 50))
    limit: number = 50;
}
