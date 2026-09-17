import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { ReviewService } from './review.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface.js';
import { AuthGuard } from '@nestjs/passport';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(AuthGuard('jwt')) // Only logged-in users can post a review
  create(@Req() req: RequestWithUser, @Body() createReviewDto: CreateReviewDto) {
    // Extract userId from the decoded JWT token
    const userId = req.user.userId;
    return this.reviewService.create(userId, createReviewDto);
  }

  @Get('product/:productId')
  // Public route - anyone can read reviews for a product
  findByProduct(@Param('productId') productId: string) {
    return this.reviewService.findByProduct(productId);
  }
}
