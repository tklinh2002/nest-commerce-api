import { Module } from '@nestjs/common';
import { OrderController } from './order.controller.js';
import { OrderService } from './order.service.js';
import { BullModule } from '@nestjs/bullmq';
import { OrderProcessor } from '../notifications/order.processor.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    BullModule.registerQueue({ 
      name: 'order-queue'
    })
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderProcessor]
})
export class OrderModule {}
