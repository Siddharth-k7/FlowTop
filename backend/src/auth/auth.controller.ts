import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { clientIp } from '../common/http/client-ip';
import { AUTH_MESSAGES } from './auth.constants';
import { AuthGuard } from './auth.guard';
import { AuthService, MfaRequired, SignedIn } from './auth.service';
import type { AuthUser } from './auth-user';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { MfaDto } from './dto/mfa.dto';
import { PasswordResetConfirmDto, PasswordResetRequestDto } from './dto/password-reset.dto';
import { PasswordResetService } from './password-reset.service';
import { clearSessionCookie, readSessionCookie, setSessionCookie } from './session-cookie';

type LoginResponse = { user: AuthUser; requiresMfa: false } | { requiresMfa: true; mfaToken: string };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: LoginResponse }> {
    return { data: respond(await this.auth.login(dto.email, dto.password, clientIp(req)), res) };
  }

  @Post('mfa')
  @HttpCode(HttpStatus.OK)
  async mfa(
    @Body() dto: MfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ data: LoginResponse }> {
    return { data: respond(await this.auth.completeMfa(dto.mfaToken, dto.code, clientIp(req)), res) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(readSessionCookie(req));
    clearSessionCookie(res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser): { data: { user: AuthUser } } {
    return { data: { user } };
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.ACCEPTED)
  requestPasswordReset(@Body() dto: PasswordResetRequestDto, @Req() req: Request): { data: { message: string } } {
    // Not awaited on purpose: the response must not wait on whether the account exists.
    void this.passwordReset.request(dto.email, clientIp(req));
    return { data: { message: AUTH_MESSAGES.resetRequested } };
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto, @Req() req: Request): Promise<void> {
    await this.passwordReset.confirm(dto.token, dto.password, clientIp(req));
  }
}

/** The session token goes into the httpOnly cookie, never into the body. */
function respond(outcome: SignedIn | MfaRequired, res: Response): LoginResponse {
  if (outcome.requiresMfa) {
    return { requiresMfa: true, mfaToken: outcome.mfaToken };
  }
  setSessionCookie(res, outcome.sessionToken);
  return { user: outcome.user, requiresMfa: false };
}
