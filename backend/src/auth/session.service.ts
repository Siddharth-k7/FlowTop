import { Injectable } from '@nestjs/common';
import { SESSION_TTL_MS } from './auth.constants';
import { AuthUser } from './auth-user';
import { AuthRepository } from './auth.repository';
import { hashToken, newSecretToken } from './secret-token';

@Injectable()
export class SessionService {
  constructor(private readonly repository: AuthRepository) {}

  /** Starts a session and returns the raw token for the cookie. Only its hash is stored. */
  async create(userId: string): Promise<string> {
    const { token, tokenHash } = newSecretToken();
    await this.repository.createSession(userId, tokenHash, new Date(Date.now() + SESSION_TTL_MS));
    return token;
  }

  resolve(token: string): Promise<AuthUser | null> {
    return this.repository.findSessionUser(hashToken(token), new Date());
  }

  async revoke(token: string): Promise<void> {
    await this.repository.deleteSession(hashToken(token));
  }
}
