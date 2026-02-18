import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    content!: string;
}
