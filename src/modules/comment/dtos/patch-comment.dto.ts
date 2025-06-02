import { IsNotEmpty, IsString } from 'class-validator';

export class PatchCommentDto {
    @IsNotEmpty()
    @IsString()
    text: string;
}
