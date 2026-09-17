import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';

@Injectable()
export class WishlistService {
  // Helper function to get or create a wishlist
  private async getOrCreateWishlist(userId: string) {
    const wishlist = await db.orm.public.Wishlist.where({ userId }).first();
    if (wishlist) {
      return wishlist;
    }
    return await db.orm.public.Wishlist.create({ userId });
  }

  async getWishlist(userId: string) {
    const wishlist = await this.getOrCreateWishlist(userId);
    
    // Fetch all items inside the wishlist and include the actual product details
    return await db.orm.public.WishlistItem
      .where({ wishlistId: wishlist.id })
      .include('product')
      .all();
  }

  async addToWishlist(userId: string, productId: string) {
    // 1. Verify the product exists
    const product = await db.orm.public.Product.where({ id: productId }).first();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const wishlist = await this.getOrCreateWishlist(userId);

    // 2. Check if the product is already in the wishlist
    const existingItem = await db.orm.public.WishlistItem.where({
      wishlistId: wishlist.id,
      productId: productId,
    }).first();

    if (existingItem) {
      throw new BadRequestException('Product is already in your wishlist');
    }

    // 3. Add it
    return await db.orm.public.WishlistItem.create({
      wishlistId: wishlist.id,
      productId: productId,
    });
  }

  async removeFromWishlist(userId: string, productId: string) {
    const wishlist = await db.orm.public.Wishlist.where({ userId }).first();
    if (!wishlist) {
      throw new NotFoundException('Wishlist is empty');
    }

    const item = await db.orm.public.WishlistItem.where({
      wishlistId: wishlist.id,
      productId: productId,
    }).first();

    if (!item) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await db.orm.public.WishlistItem.where({ id: item.id }).delete();
    return { message: 'Removed from wishlist successfully' };
  }
}
