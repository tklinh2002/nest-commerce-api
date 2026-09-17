import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { db } from '../prisma/db.js';
import { CheckoutDto } from './dto/order.dto.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CouponService } from '../coupon/coupon.service.js';

@Injectable()
export class OrderService {
  constructor(
    // Connect to the 'email-queue' defined in AppModule
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectQueue('order-queue') private readonly orderQueue: Queue,
    private readonly couponService: CouponService,
  ) {}

  async checkout(userId: string, userEmail: string, checkoutDto: CheckoutDto) {
    const { addressId, couponCode } = checkoutDto;

    // 1. Start a database transaction
    // Everything inside this block is strictly protected. If any error is thrown, it rolls back!
    const finalOrder = await db.transaction(async (tx) => {
      
      // 2. Fetch the user's cart and all nested items
      const cart = await tx.orm.public.Cart
        .where({ userId })
        .include('items', (items) => items.include('product'))
        .first();

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }
      // 3. Verify stock and calculate total amount (Zero 'let' using Array.reduce)
      const originalTotal = cart.items.reduce((sum, item) => {
        if (item.product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${item.product.name}`);
        }
        return sum + (Number(item.product.price) * item.quantity);
      }, 0);
      // If a couponCode is provided, validate it and calculate the discount amount
      const discountResult = couponCode 
        ? await this.couponService.validateCoupon(couponCode, originalTotal)
        : { discountAmount: 0, couponId: null };
      // Final total = Original total - Discount (ensure it doesn't go below 0)
      const finalAmount = Math.max(0, originalTotal - discountResult.discountAmount);
      const order = await tx.orm.public.Order.create({
        userId,
        addressId,
        couponId: discountResult.couponId,
        discountAmount: String(discountResult.discountAmount), // Prisma 8 Decimal fields require a String
        totalAmount: String(finalAmount),
      });

      // 5. Move CartItems to OrderItems and Decrease Stock
      // Using 'for...of' with 'const' complies with the "no let" rule perfectly!
      for (const item of cart.items) {
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

    // Increment the usage count for the coupon if one was successfully applied
    if (checkoutDto.couponCode) {
      await this.couponService.incrementUsage(finalOrder.couponId!);
    }

    // 7. Push a background job to the queue AFTER the transaction successfully commits.
    // We don't use 'await' here because we don't want to block the HTTP response!
    this.emailQueue.add('send-order-confirmation', {
      orderId: finalOrder.id,
      userEmail: userEmail,
    });

    // 8. Push a delayed job to automatically cancel the order if not paid in 15 minutes
    // We pass the delay option (15 minutes in milliseconds)
    this.orderQueue.add(
      'check-payment-timeout',
      { orderId: finalOrder.id, userId: userId },
      { delay: 15 * 60 * 1000 } 
    );
      
    return finalOrder;

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

    // Webhook endpoint called by Payment Gateway (VNPay, Stripe, etc.)
  async handlePaymentWebhook(orderId: string) {
    const order = await db.orm.public.Order.where({ id: orderId }).first();
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === 'PAID') {
      return { message: 'Order is already paid' };
    }

    // Update payment status to PAID and order status to PROCESSING
    const updatedOrder = await db.orm.public.Order
      .where({ id: orderId })
      .update({ 
        paymentStatus: 'PAID',
        status: 'PROCESSING' // Now the warehouse can start packing
      });

    return {
      message: 'Payment verified and order updated successfully',
      order: updatedOrder
    };
  }

}
