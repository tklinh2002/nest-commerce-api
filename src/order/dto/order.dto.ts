import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  addressId!: string; // ID of the chosen delivery address

  @IsOptional()
  @IsString()
  couponCode?: string;
}
