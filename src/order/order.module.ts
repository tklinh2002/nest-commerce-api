import { Module } from '@nestjs/common';
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';
import { BullModule } from '@nestjs/bullmq';
import { OrderProcessor } from '../notifications/order.processor.js';
import { CouponModule } from '../coupon/coupon.module.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    BullModule.registerQueue({ 
      name: 'order-queue'
    }),
    CouponModule
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderProcessor]
})
export class OrderModule {}
