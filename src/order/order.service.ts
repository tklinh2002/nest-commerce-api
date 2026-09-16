import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CheckoutDto } from './dto/order.dto.js';

@Injectable()
export class OrderService {

  async checkout(userId: string, checkoutDto: CheckoutDto) {
    const { addressId } = checkoutDto;

    // 1. Start a database transaction
    // Everything inside this block is strictly protected. If any error is thrown, it rolls back!
    return await db.transaction(async (tx) => {
      
      // 2. Fetch the user's cart and all nested items
      const cart = await tx.orm.public.Cart
        .where({ userId })
        .include('items', (items) => items.include('product'))
        .first();

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // 3. Verify stock and calculate total amount (Zero 'let' using Array.reduce)
      const totalAmount = cart.items.reduce((sum, item) => {
        // If someone else bought it first and stock is empty, throw error to rollback
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${item.product.name}`);
        }
        return sum + (Number(item.product.price) * item.quantity);
      }, 0);

      // 4. Create the Order in Database
      const order = await tx.orm.public.Order.create({
        userId,
        addressId,
        totalAmount: totalAmount.toString(), // Prisma 8 Decimal maps to String
      });

      // 5. Move CartItems to OrderItems and Decrease Stock
      // Using 'for...of' with 'const' complies with the "no let" rule perfectly!
      for (const item of cart.items) {
        // Decrease stock
        await tx.orm.public.Product
          .where({ id: item.productId })
          .update({ stock: item.product.stock - item.quantity });

        // Create OrderItem
        await tx.orm.public.OrderItem.create({
          orderId: order.id,
          productId: item.productId,
          price: item.product.price,
          quantity: item.quantity,
        });
      }

      // 6. Clear the user's cart since they just bought everything
      await tx.orm.public.CartItem.where({ cartId: cart.id }).delete();

      return order;
    });
  }

    // Fetch order history for the user
  async getOrders(userId: string) {
    return await db.orm.public.Order
      .where({ userId })
      .include('items', (items) => items.include('product'))
      .orderBy((model) => model.createdAt.desc()) // Show newest orders first
      .all();
  }

    // Cancel an order and restore stock
  async cancelOrder(userId: string, orderId: string) {
    return await db.transaction(async (tx) => {
      // 1. Find the order and eagerly load its items
      const order = await tx.orm.public.Order
        .where({ id: orderId, userId })
        .include('items')
        .first();

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // 2. Only allow cancelling if the order is still PENDING
      if (order.status !== 'PENDING') {
        throw new BadRequestException('Only PENDING orders can be cancelled');
      }

      // 3. Update order status to CANCELLED
      const cancelledOrder = await tx.orm.public.Order
        .where({ id: order.id })
        .update({ status: 'CANCELLED' });

      // 4. Restore the stock for each product in the order
      for (const item of order.items) {
        const product = await tx.orm.public.Product.where({ id: item.productId }).first();
        if (product) {
          await tx.orm.public.Product
            .where({ id: product.id })
            .update({ stock: product.stock + item.quantity });
        }
      }

      return cancelledOrder;
    });
  }

}
