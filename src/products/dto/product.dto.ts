import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  price!: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Stock cannot be negative' })
  stock?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[]; // Array of image URLs

  @IsString()
  @IsNotEmpty()
  categoryId!: string; // Important: Which category does this product belong to?
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stock?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  categoryId?: string;
}
