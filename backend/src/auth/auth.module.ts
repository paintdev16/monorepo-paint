import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy, jwtSecret } from './jwt.strategy.js';

@Module({
  imports: [PassportModule, JwtModule.registerAsync({ useFactory: () => ({ secret: jwtSecret(), signOptions: { algorithm: 'HS256', expiresIn: 900 } }) })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
