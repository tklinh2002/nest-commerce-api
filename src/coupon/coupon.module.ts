import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service.js';
import { CouponController } from './coupon.controller.js';

@Module({
  providers: [CouponService],
  controllers: [CouponController],
  exports: [CouponService]
})
export class CouponModule {}
