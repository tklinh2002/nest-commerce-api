import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here if needed
    return super.canActivate(context);
  }

    handleRequest<TUser>(
    err: unknown,
    user: unknown,
  ): TUser {
    // Throw an exception if no user is found or an error occurred
    if (err || !user) {
      throw err || new UnauthorizedException('Please log in first');
    }
    
    return user as TUser;
  }

}
