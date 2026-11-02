import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { configureSessionCookie } from './auth/session-cookie';
import { Env, NodeEnv } from './config/env.validation';

export const API_PREFIX = 'api/v1';

/** HTTP-level setup shared by main.ts and the e2e tests. The global pipe and filter live in AppModule. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));
  configureSessionCookie({
    sameSite: config.get('SESSION_COOKIE_SAME_SITE', { infer: true }),
    domain: config.get('SESSION_COOKIE_DOMAIN', { infer: true }),
  });
  app.use(cookieParser());
  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  app.enableCors({ origin: config.get('CORS_ORIGINS', { infer: true }), credentials: true });

  if (config.get('NODE_ENV', { infer: true }) !== NodeEnv.PRODUCTION) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Flowtop API').setVersion('1').build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
