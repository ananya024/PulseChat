// auth.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);  
    if (!token) {
      throw new UnauthorizedException({
          code: "INVALID_TOKEN",
          message: "JWT verification failed",
      });
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);
      this.logger.debug(`Token verified | user=${payload.username}`);
      request['user'] = payload;
    } catch (err){
      this.logger.warn("JWT verification failed");
      throw new UnauthorizedException({
          code: "INVALID_CREDENTIALS",
          message: "Invalid username or password",
      });
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}