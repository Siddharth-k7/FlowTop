import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Env, NodeEnv } from '../config/env.validation';

/** The emails the auth and users modules send. Replaced by the email module in task 2.3. */
export abstract class AuthMailer {
  abstract sendPasswordReset(to: string, resetUrl: string): Promise<void>;

  abstract sendInvite(to: string, name: string, acceptUrl: string): Promise<void>;
}

const DEV_EMAIL_DIR = '.dev-emails';

/**
 * Stand-in until the email module lands (task 2.3): writes each email to
 * backend/.dev-emails/ instead of sending it. Refuses to run in production,
 * so a missing provider fails loudly instead of silently.
 */
@Injectable()
export class DevFileAuthMailer extends AuthMailer {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    return this.write('password-reset', to, 'Reset your Flowtop admin password', [
      resetUrl,
      '',
      'This link works once and expires in 30 minutes.',
    ]);
  }

  sendInvite(to: string, name: string, acceptUrl: string): Promise<void> {
    return this.write('invite', to, 'You have been invited to the Flowtop admin', [
      `Hi ${name},`,
      '',
      'Set your password to activate your account:',
      acceptUrl,
      '',
      'This link works once and expires in 72 hours.',
    ]);
  }

  private async write(kind: string, to: string, subject: string, body: string[]): Promise<void> {
    if (this.config.get('NODE_ENV', { infer: true }) === NodeEnv.PRODUCTION) {
      throw new Error('No email provider is configured. Auth emails need the email module (task 2.3).');
    }
    await mkdir(DEV_EMAIL_DIR, { recursive: true });
    await writeFile(join(DEV_EMAIL_DIR, `${Date.now()}-${kind}.txt`), [`To: ${to}`, `Subject: ${subject}`, '', ...body].join('\n'));
  }
}
