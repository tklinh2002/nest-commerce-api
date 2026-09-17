import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';

@Injectable()
export class AdminService {
  async getDashboardStats() {
    // 1. Calculate total revenue and total number of orders in a single database query
    const orderStats = await db.orm.public.Order.aggregate((a) => ({
      totalOrders: a.count(),
      totalRevenue: a.sum('totalAmount'),
    }));

    // 2. Count total registered users
    const userStats = await db.orm.public.User.aggregate((a) => ({
      totalUsers: a.count(),
    }));

    // 3. Count total products in the store
    const productStats = await db.orm.public.Product.aggregate((a) => ({
      totalProducts: a.count(),
    }));

    // Prisma 8 returns sum() as a Decimal string (or null if the table is empty).
    // We convert it to a Number and fallback to 0 if it's null.
    const revenue = orderStats.totalRevenue ? Number(orderStats.totalRevenue) : 0;

    return {
      revenue,
      totalOrders: orderStats.totalOrders,
      totalUsers: userStats.totalUsers,
      totalProducts: productStats.totalProducts,
    };
  }
}
