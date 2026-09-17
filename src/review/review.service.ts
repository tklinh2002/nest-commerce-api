import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { db } from '../prisma/db.js';

@Injectable()
export class ReviewService {
  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { productId, rating, comment } = createReviewDto;

    // Check if the user has already reviewed this product
    const existingReview = await db.orm.public.Review.where({ 
      userId, 
      productId 
    }).first();

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Create the new review in the database
    const review = await db.orm.public.Review.create({
      userId,
      productId,
      rating,
      comment,
    });

    return review;
  }

  async findByProduct(productId: string) {
    // Fetch all reviews for a specific product and include the reviewer's data
    const reviews = await db.orm.public.Review
      .where({ productId })
      .include('user')
      .orderBy((model) => model.createdAt.desc()) // Show newest first
      .all();

    return reviews;
  }
}
