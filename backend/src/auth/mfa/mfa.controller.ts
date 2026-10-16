import { Body, Controller, Header, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../auth.guard';
import type { AuthUser } from '../auth-user';
import { CurrentUser } from '../current-user.decorator';
import { readSessionCookie } from '../session-cookie';
import { AllowDuringMfaSetup } from './allow-during-mfa-setup.decorator';
import { MfaDisableDto, MfaSetupDto, MfaVerifyDto } from './mfa.dto';
import type { MfaEnabledResponse, MfaSetupResponse } from './mfa.dto';
import { MfaService } from './mfa.service';

/**
 * Enrolment and removal of two-step sign-in, for the signed-in user's own
 * account. Responses carry secrets (the TOTP secret, the recovery codes), so
 * nothing here may be cached.
 */
@ApiTags('auth')
@Controller('auth/mfa')
@UseGuards(AuthGuard)
export class MfaController {
  constructor(private readonly mfa: MfaService) {}

  /** Reachable by a super admin who has not set up MFA yet: this is how they do it. */
  @Post('setup')
  @AllowDuringMfaSetup()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async setup(@Body() dto: MfaSetupDto, @CurrentUser() user: AuthUser): Promise<{ data: MfaSetupResponse }> {
    return { data: await this.mfa.setup(user, dto.password) };
  }

  @Post('verify')
  @AllowDuringMfaSetup()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async verify(
    @Body() dto: MfaVerifyDto,
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
  ): Promise<{ data: MfaEnabledResponse }> {
    return { data: await this.mfa.verify(user, dto.code, readSessionCookie(req) ?? '') };
  }

  @Post('disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disable(@Body() dto: MfaDisableDto, @CurrentUser() user: AuthUser, @Req() req: Request): Promise<void> {
    await this.mfa.disable(user, dto, readSessionCookie(req) ?? '');
  }
}
