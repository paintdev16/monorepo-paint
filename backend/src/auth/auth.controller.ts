import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto, CredentialsDto, RefreshDto, RegisterDto } from './auth.dto.js';

type AuthenticatedRequest = { user: { id: string; email: string; name: string | null; sessionId: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() input: RegisterDto) { return this.auth.register(input); }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(200)
  @Post('login')
  login(@Body() input: CredentialsDto) { return this.auth.login(input); }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() input: RefreshDto) { return this.auth.refresh(input.refreshToken); }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() request: AuthenticatedRequest) { return { id: request.user.id, email: request.user.email, name: request.user.name }; }

  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  @Post('logout')
  logout(@Req() request: AuthenticatedRequest) { return this.auth.logout(request.user.sessionId, request.user.id); }

  @UseGuards(AuthGuard('jwt'))
  @HttpCode(204)
  @Post('logout-all')
  logoutAll(@Req() request: AuthenticatedRequest) { return this.auth.logoutAll(request.user.id); }

  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(204)
  @Post('change-password')
  changePassword(@Req() request: AuthenticatedRequest, @Body() input: ChangePasswordDto) {
    return this.auth.changePassword(request.user.id, input.currentPassword, input.newPassword);
  }
}
