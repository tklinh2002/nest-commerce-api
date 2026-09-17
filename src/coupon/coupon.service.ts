import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { db } from '../prisma/db.js';
import { Temporal } from 'temporal-polyfill';

@Injectable()
export class CouponService {
  async create(createCouponDto: CreateCouponDto) {
    // Check if the coupon code already exists
    const existing = await db.orm.public.Coupon.where({ code: createCouponDto.code }).first();
    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    // Prisma 8 requires Decimal fields to be seeded as string values to preserve precision
    const coupon = await db.orm.public.Coupon.create({
      code: createCouponDto.code,
      discountType: createCouponDto.discountType,
      discountValue: String(createCouponDto.discountValue),
      minOrderAmount: createCouponDto.minOrderAmount ? String(createCouponDto.minOrderAmount) : null,
      maxDiscount: createCouponDto.maxDiscount ? String(createCouponDto.maxDiscount) : null,
      endDate: Temporal.Instant.from(new Date(createCouponDto.endDate).toISOString()),
      usageLimit: createCouponDto.usageLimit,
    });

    return coupon;
  }

  async validateCoupon(code: string, orderTotal: number) {
    const coupon = await db.orm.public.Coupon.where({ code }).first();
    
    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    const now = new Date();
    if (new Date(coupon.endDate) < now) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    // Cast Decimal string back to Number for calculation
    if (coupon.minOrderAmount && orderTotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(`Minimum order amount is ${coupon.minOrderAmount}`);
    }

    let discountAmount = 0;
    const discountValNum = Number(coupon.discountValue);

    if (coupon.discountType === 'FIXED') {
      discountAmount = discountValNum;
    } else if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (orderTotal * discountValNum) / 100;
      const maxDiscountNum = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
      
      // Limit the discount amount if a maxDiscount is configured
      if (maxDiscountNum && discountAmount > maxDiscountNum) {
        discountAmount = maxDiscountNum;
      }
    }

    // Discount cannot exceed the order total
    return {
      couponId: coupon.id,
      discountAmount: discountAmount > orderTotal ? orderTotal : discountAmount,
    };
  }

  // Increment the usage count after a successful checkout
  async incrementUsage(couponId: string) {
    const coupon = await db.orm.public.Coupon.where({ id: couponId }).first();
    if (coupon) {
      await db.orm.public.Coupon.where({ id: couponId }).update({
        usedCount: coupon.usedCount + 1,
      });
    }
  }
}
