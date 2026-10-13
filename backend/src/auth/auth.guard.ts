import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api.exception';
import { AUTH_MESSAGES } from './auth.constants';
import { AuthenticatedRequest } from './auth-user';
import { readSessionCookie } from './session-cookie';
import { SessionService } from './session.service';

/**
 * Rejects any request without a live session with 401 UNAUTHENTICATED, and
 * puts the signed-in user on the request for @CurrentUser().
 *
 *   @UseGuards(AuthGuard)
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readSessionCookie(request);
    const user = token ? await this.sessions.resolve(token) : null;

    if (!user) {
      throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.signInRequired);
    }
    request.user = user;
    return true;
  }
}
