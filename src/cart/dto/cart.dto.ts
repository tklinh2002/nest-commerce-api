import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  productId!: string; // The ID of the product the user wants to buy

  @IsNumber()
  @Min(1)
  quantity!: number; // Must be at least 1
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity!: number; // Must be at least 1
}
