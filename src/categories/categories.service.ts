import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';
import { db } from '../prisma/db.js';

@Injectable()
export class CategoriesService {
  async create(createCategoryDto: CreateCategoryDto) {
    return await db.orm.public.Category.create(createCategoryDto);
  }

  async findAll() {
    return await db.orm.public.Category.where({}).all();
  }

  async findOne(id: string) {
    const category = await db.orm.public.Category.where({ id }).first();
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // check exist
    
    return await db.orm.public.Category.where({ id }).update(updateCategoryDto);
  }

  async remove(id: string) {
    await this.findOne(id); // check exist
    
    return await db.orm.public.Category.where({ id }).delete();
  }
}
