import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // Specify that the token will be read from the Header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Expired tokens will automatically throw a 401 Unauthorized error
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')|| 'fallback_secret_key',
    });
  }

  // The validate method is automatically called if the token is valid
  async validate(payload: { sub: string; email: string; role: string }) {
    // You can check if the user is locked or deleted here
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    
    // The data returned here will be automatically attached to the req.user object by NestJS
    return { userId: user.id, email: user.email, role: user.role };
  }
}
