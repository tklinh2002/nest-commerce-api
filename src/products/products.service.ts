import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
import { db } from '../prisma/db.js';

@Injectable()
export class ProductsService {
    async create(createProductDto: CreateProductDto) {
    return await db.orm.public.Product.create({
      ...createProductDto, 
      // Prisma Decimal type requires a string to prevent JS floating-point precision issues
      price: createProductDto.price.toString(),
      // Prisma scalar lists do not accept undefined, must fallback to empty array
      images: createProductDto.images || [],
    });
  }

  // Fetch all products with pagination and category filtering
  async findAll(page: number = 1, limit: number = 10, categoryId?: string, search?: string) {
    const offset = (page - 1) * limit;

   // Start with an empty query (gets everything)
    let query = db.orm.public.Product.where({});
    // If categoryId is provided, chain a where condition
    if (categoryId) {
      query = query.where({ categoryId });
    }
    // If search keyword is provided, chain an ILIKE condition
    if (search) {
      // Prisma 8 proxy syntax for ILIKE (case-insensitive search)
      query = query.where((p) => p.name.ilike(`%${search}%`)); // TODO: Leading wildcards prevent B-tree index usage
    }

    return await query
      .limit(limit)
      .offset(offset)
      .all();
  }

  async findOne(id: string) {
    const product = await db.orm.public.Product.where({ id }).first();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Ensure product exists before updating
    return await db.orm.public.Product.where({ id }).update({
      ...updateProductDto, 
      // Prisma Decimal type requires a string to prevent JS floating-point precision issues
      price: updateProductDto.price?.toString(),
      // Prisma scalar lists do not accept undefined, must fallback to empty array
      images: updateProductDto.images || [],
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure product exists before deleting
    return await db.orm.public.Product.where({ id }).delete();
  }
}
