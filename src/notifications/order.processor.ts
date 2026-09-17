import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { OrderService } from '../order/order.service';

// Listen to all jobs added to the 'order-queue'
@Processor('order-queue')
export class OrderProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderProcessor.name);

  // Inject OrderService to reuse the cancelOrder logic
  constructor(private readonly orderService: OrderService) {
    super();
  }

  // Use 'unknown' instead of 'any' to ensure Clean Code compliance
  async process(job: Job<unknown, unknown, string>): Promise<void> {
    const data = job.data as { orderId: string; userId: string };
    
    this.logger.log(`[x] Checking payment status for Order: ${data.orderId}...`);
    
    try {
      // Try to cancel the order using the logic we wrote in Phase 3
      await this.orderService.cancelOrder(data.userId, data.orderId);
      this.logger.log(`[!] Order ${data.orderId} was PENDING for too long. Auto-cancelled and stock restored!`);
    } catch {
      // If cancelOrder throws an error, it means the order is already PAID or CANCELLED
      this.logger.log(`[v] Order ${data.orderId} is safe (Already PAID or CANCELLED).`);
    }
  }
}
