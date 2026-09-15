import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';


@Injectable()
export class UsersService {
  // Find user by email
  async findByEmail(email: string) {
    return await db.orm.public.User.where({ email }).first();
  }

  // Find user by ID
  async findById(id: string) {
    return await db.orm.public.User.where({ id }).first();
  }

  // Create a new user (Using Parameters to extract the exact type required by the create function)
  async create(data: Parameters<typeof db.orm.public.User.create>[0]) {
    return await db.orm.public.User.create(data);
  }

  // Update Refresh Token
  async updateRefreshToken(id: string, refreshToken: string | null) {
    return await db.orm.public.User.where({ id }).update({ refreshToken });
  }
}
