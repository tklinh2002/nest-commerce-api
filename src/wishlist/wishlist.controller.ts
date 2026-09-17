import { Controller, Post, Body, UseGuards, Req, Get, Delete, Param } from '@nestjs/common';
import { WishlistService } from './wishlist.service.js';
import { AddToWishlistDto } from './dto/wishlist.dto.js';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface.js';
import { AuthGuard } from '@nestjs/passport';

@Controller('wishlist')
@UseGuards(AuthGuard('jwt')) // All wishlist endpoints require authentication
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Req() req: RequestWithUser) {
    return this.wishlistService.getWishlist(req.user.userId);
  }

  @Post('add')
  add(@Req() req: RequestWithUser, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.addToWishlist(req.user.userId, dto.productId);
  }

  @Delete('remove/:productId')
  remove(@Req() req: RequestWithUser, @Param('productId') productId: string) {
    return this.wishlistService.removeFromWishlist(req.user.userId, productId);
  }
}
