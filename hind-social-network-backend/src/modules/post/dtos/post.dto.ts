import { IsString, IsArray, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    userId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    content!: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    mediaUrls?: string[];
}

