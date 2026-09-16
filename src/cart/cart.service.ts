import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { AddToCartDto } from './dto/cart.dto.js';

@Injectable()
export class CartService {
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    // 1. Verify that the product actually exists
    const product = await db.orm.public.Product.where({ id: productId }).first();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Find the user's cart, or create a new one if it doesn't exist
    const existingCart = await db.orm.public.Cart.where({ userId }).first();
    const cart = existingCart ? existingCart : await db.orm.public.Cart.create({ userId });

    // 3. Check if the product is already in the cart
    const existingItem = await db.orm.public.CartItem
      .where({ cartId: cart.id, productId })
      .first();

    if (existingItem) {
      // 3a. If it exists, update the quantity (add them up)
      await db.orm.public.CartItem
        .where({ id: existingItem.id })
        .update({ quantity: existingItem.quantity + quantity });
    } else {
      // 3b. If it does not exist, add a new CartItem
      await db.orm.public.CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
      });
    }

    // 4. Return the updated cart with its items and product details
    // Prisma 8 chaining syntax for eager-loading nested relations
    return await db.orm.public.Cart
      .where({ id: cart.id })
      .include('items', (items) => items.include('product'))
      .first();
  }

   // Fetch the user's cart
  async getCart(userId: string) {
    const cart = await db.orm.public.Cart
      .where({ userId })
      .include('items', (items) => items.include('product'))
      .first();
    // If the user hasn't added anything to the cart yet, return an empty array
    if (!cart) {
      return { items: [] };
    }
    return cart;
  }

  // Update the quantity of a specific product in the cart
  async updateCartItem(userId: string, productId: string, quantity: number) {
    const cart = await db.orm.public.Cart.where({ userId }).first();
    if (!cart) throw new NotFoundException('Cart not found');
    const item = await db.orm.public.CartItem.where({ cartId: cart.id, productId }).first();
    if (!item) throw new NotFoundException('Item not found in cart');
    // Update the item's quantity
    await db.orm.public.CartItem.where({ id: item.id }).update({ quantity });
    // Return the latest cart data after updating
    return this.getCart(userId);
  }
  
  // Remove a specific product from the cart completely
  async removeCartItem(userId: string, productId: string) {
    const cart = await db.orm.public.Cart.where({ userId }).first();
    if (!cart) throw new NotFoundException('Cart not found');
    // Delete the item from the database
    await db.orm.public.CartItem.where({ cartId: cart.id, productId }).delete();
    // Return the latest cart data after removing
    return this.getCart(userId);
  }
}
