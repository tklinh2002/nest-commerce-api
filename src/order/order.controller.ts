import { Controller, Post, Get, Body, Req, UseGuards, Patch, Param } from '@nestjs/common';
import { OrderService } from './order.service.js';
import { CheckoutDto } from './dto/order.dto.js';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface.js';

@Controller('orders')
@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // POST /orders/checkout
  @Post('checkout')
  checkout(@Req() req: RequestWithUser, @Body() checkoutDto: CheckoutDto) {
    const userId = req.user.userId;
    const userEmail = req.user.email;
    return this.orderService.checkout(userId, userEmail, checkoutDto);
  }

  // GET /orders
  @Get()
  getOrders(@Req() req: RequestWithUser) {
    const userId = req.user.userId;
    return this.orderService.getOrders(userId);
  }

  // PATCH /orders/:id/cancel
  @Patch(':id/cancel')
  cancelOrder(
    @Req() req: RequestWithUser, 
    @Param('id') orderId: string
  ) {
    const userId = req.user.userId;
    return this.orderService.cancelOrder(userId, orderId);
  }

  // POST /orders/:id/payment-webhook
  // Normally this doesn't use JWT, it uses a signature verification logic (e.g. HMAC from VNPay)
  // For the sake of this tutorial, we will keep it simple and unprotected.
  @Post(':id/payment-webhook')
  handlePaymentWebhook(@Param('id') orderId: string) {
    return this.orderService.handlePaymentWebhook(orderId);
  }

}
