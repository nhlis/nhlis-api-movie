import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class PostCommentDto {
    @IsNotEmpty()
    @IsString()
    episode_id: string;

    @IsNotEmpty()
    @IsString()
    text: string;

    @IsOptional()
    @IsString()
    parent_id?: string;

    @IsOptional()
    @IsString()
    reply_id?: string;

    @ValidateIf((o) => !!o.reply_id)
    @IsNotEmpty()
    @IsString()
    reply_profile_id?: string;
}
