import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadChunkDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // Unique file identifier (e.g., a UUID string)

  @IsNumber()
  @Type(() => Number) // Required because multipart/form-data sends everything as strings
  chunkIndex!: number; // Index of the current chunk (0, 1, 2...)

  @IsNumber()
  @Type(() => Number)
  totalChunks!: number; // Total number of chunks (e.g., 5)

  @IsString()
  @IsNotEmpty()
  originalname!: string; // Original file name (e.g., video.mp4)
}
