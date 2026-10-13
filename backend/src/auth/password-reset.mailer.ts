import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Env, NodeEnv } from '../config/env.validation';

export abstract class PasswordResetMailer {
  abstract sendPasswordReset(to: string, resetUrl: string): Promise<void>;
}

const DEV_EMAIL_DIR = '.dev-emails';

/**
 * Stand-in until the email module lands (task 2.3): writes each email to
 * backend/.dev-emails/ instead of sending it. Refuses to run in production,
 * so a missing provider fails loudly in the logs instead of silently.
 */
@Injectable()
export class DevFilePasswordResetMailer extends PasswordResetMailer {
  constructor(private readonly config: ConfigService<Env, true>) {
    super();
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    if (this.config.get('NODE_ENV', { infer: true }) === NodeEnv.PRODUCTION) {
      throw new Error('No email provider is configured. Password reset emails need the email module (task 2.3).');
    }
    await mkdir(DEV_EMAIL_DIR, { recursive: true });
    await writeFile(
      join(DEV_EMAIL_DIR, `${Date.now()}-password-reset.txt`),
      [
        `To: ${to}`,
        'Subject: Reset your Flowtop admin password',
        '',
        resetUrl,
        '',
        'This link works once and expires in 30 minutes.',
      ].join('\n'),
    );
  }
}
