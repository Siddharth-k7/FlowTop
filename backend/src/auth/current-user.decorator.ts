import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiException } from '../common/errors/api.exception';
import { AUTH_MESSAGES } from './auth.constants';
import { AuthenticatedRequest, AuthUser } from './auth-user';

/** The signed-in user. Only valid on a route protected by AuthGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
  if (!user) {
    // A route used @CurrentUser() without AuthGuard. Fail closed rather than run without a user.
    throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.signInRequired);
  }
  return user;
});
