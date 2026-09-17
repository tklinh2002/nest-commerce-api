import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

// Listen to all jobs added to the 'email-queue'
@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  // Use 'unknown' instead of 'any' to ensure Clean Code compliance
  async process(job: Job<unknown, unknown, string>): Promise<void> {
    // Type casting to strictly define the expected payload
    const data = job.data as { orderId: string; userEmail: string };
    
    this.logger.log(`[x] Starting to send email for Order: ${data.orderId}...`);
    
    // Simulate network delay for sending an email (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    this.logger.log(`[v] Successfully sent order confirmation email to ${data.userEmail}!`);
  }
}
