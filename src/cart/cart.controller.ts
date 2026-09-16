import { Controller, Post, Get, Body, Req, UseGuards, Patch, Param, Delete } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto.js';
import { AuthGuard } from '@nestjs/passport'; // Import AuthGuard from Passport
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface.js';

@Controller('cart')
@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller (Must have JWT token)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  addToCart(@Req() req: RequestWithUser, @Body() addToCartDto: AddToCartDto) {
    // Extract the userId that was attached to the request by the JwtStrategy
    const userId = req.user.userId; 
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Get()
  getCart(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.cartService.getCart(userId);
  }

    // Update the quantity of a specific item in the cart
  @Patch(':productId')
  updateCartItem(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string, // Extract the productId from the URL
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const userId = req.user.userId;
    return this.cartService.updateCartItem(userId, productId, updateCartItemDto.quantity);
  }

  // Remove a specific item from the cart
  @Delete(':productId')
  removeCartItem(
    @Req() req: RequestWithUser, 
    @Param('productId') productId: string, // Extract the productId from the URL
  ) {
    const userId = req.user.userId;
    return this.cartService.removeCartItem(userId, productId);
  }

}
