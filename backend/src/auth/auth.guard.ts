import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiException } from '../common/errors/api.exception';
import { AUTH_MESSAGES } from './auth.constants';
import { AuthenticatedRequest } from './auth-user';
import { ALLOW_DURING_MFA_SETUP_KEY } from './mfa/allow-during-mfa-setup.decorator';
import { readSessionCookie } from './session-cookie';
import { SessionService } from './session.service';

/**
 * Rejects any request without a live session with 401 UNAUTHENTICATED, and
 * puts the signed-in user on the request for @CurrentUser().
 *
 * Also enforces IAM-04: a super admin without MFA gets 403
 * MFA_SETUP_REQUIRED on every route except the MFA setup routes. This is
 * decided from the database on each request, so it lifts the moment MFA is
 * turned on, and it fails closed: a new route is confined unless marked.
 *
 *   @UseGuards(AuthGuard)
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readSessionCookie(request);
    const user = token ? await this.sessions.resolve(token) : null;

    if (!user) {
      throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.signInRequired);
    }
    if (user.mfaSetupRequired && !this.allowedDuringMfaSetup(context)) {
      throw new ApiException('MFA_SETUP_REQUIRED', AUTH_MESSAGES.mfaSetupRequired);
    }
    request.user = user;
    return true;
  }

  private allowedDuringMfaSetup(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(ALLOW_DURING_MFA_SETUP_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }
}
