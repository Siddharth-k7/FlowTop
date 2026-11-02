# Run the API on your machine

From a fresh clone. Commands assume you are in `backend/` unless they say otherwise. Use Node 24.

## 1. Postgres

Docker has to be running before this. If `docker compose` says it cannot connect to the Docker daemon, start Docker Desktop and wait until it reports the engine is running, then run the command again.

```sh
cp .env.example .env
```

Fill `.env` from the placeholders in `.env.example`. Do not invent a second set of names. The values the API refuses to boot without:

```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://flowtop:<POSTGRES_PASSWORD>@localhost:5433/flowtop
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
ADMIN_URL=http://localhost:3001
MFA_ENCRYPTION_KEY=<openssl rand -base64 32>
MEDIA_STORAGE_DRIVER=local
MEDIA_PUBLIC_BASE_URL=http://localhost:4000/api/v1/files/public
MEDIA_LOCAL_DIR=.media
MEDIA_LOCAL_PRIVATE_BASE_URL=http://localhost:4000/api/v1/files/private
MEDIA_URL_SIGNING_KEY=<openssl rand -base64 32>
POSTGRES_PASSWORD=<openssl rand -hex 24>
FLOWTOP_DB_PORT=5433
SEED_ADMIN_EMAIL=<your email>
SEED_ADMIN_PASSWORD=<12+ characters, your own password>
SEED_ADMIN_NAME=<your name>
TEST_DATABASE_URL=postgresql://flowtop:<POSTGRES_PASSWORD>@localhost:5433/flowtop_test
```

`http://localhost:3000` is the public website. `http://localhost:3001` is the admin. `DATABASE_URL` uses the same password as `POSTGRES_PASSWORD`, user `flowtop`, database `flowtop`, port `FLOWTOP_DB_PORT`.

`POSTGRES_PASSWORD` is read by Docker Compose, not by the API. Set it before the first start. Postgres only reads it when the volume is created.

```sh
docker compose up -d
```

Wait until `docker compose ps` shows the postgres service as healthy.

## 2. Migrations and seed

```sh
npm ci
npm run prisma:migrate
npm run db:seed
```

`prisma:migrate` applies the migrations in `prisma/migrations`. `db:seed` writes permissions, the three roles, and settings. When `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are both set, it also creates that super admin. It does not overwrite an existing user. The password must be at least 12 characters.

## 3. Start the API

```sh
npm run start:dev
```

It listens on port 4000.

## 4. Create the super admin and enrol MFA

The seed in step 2 created the account. It has no MFA yet. A super admin in that state can sign in, and then can only call the two setup routes until enrolment finishes.

PowerShell aliases `curl` to `Invoke-WebRequest`. Use `curl.exe`. Replace the email and password with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

```powershell
curl.exe -sS -c $env:TEMP\flowtop-cookies.txt -H "Content-Type: application/json" -d "{`"email`":`"you@flowtop.in`",`"password`":`"replace-with-your-password`"}" http://localhost:4000/api/v1/auth/login
```

The response is 200. `user.mfaSetupRequired` is true. The session is in the cookie jar, not in the JSON.

```powershell
curl.exe -sS -b $env:TEMP\flowtop-cookies.txt -H "Content-Type: application/json" -d "{`"password`":`"replace-with-your-password`"}" http://localhost:4000/api/v1/auth/mfa/setup
```

The response is 200 `{ data: { secret, otpauthUri, expiresAt } }`. Add `otpauthUri` to an authenticator app (or enter `secret` by hand). Then send the 6-digit code:

```powershell
curl.exe -sS -b $env:TEMP\flowtop-cookies.txt -H "Content-Type: application/json" -d "{`"code`":`"123456`"}" http://localhost:4000/api/v1/auth/mfa/verify
```

The response is 200 `{ data: { recoveryCodes } }`. Copy the recovery codes now. They are not shown again.

The same cookie can now call the rest of the API. The next sign-in is different: `POST /auth/login` returns `{ requiresMfa: true, mfaToken }` and does not set the session cookie. Finish with `POST /auth/mfa` and either `{ mfaToken, code }` or `{ mfaToken, recoveryCode }`.

## 5. Check that it is up

```powershell
curl.exe -sS http://localhost:4000/health
```

A running API with a reachable database answers `{"data":{"status":"ok","database":"up"}}`.

```powershell
curl.exe -sS -D - -o NUL -H "Content-Type: application/json" -d "{`"email`":`"you@flowtop.in`",`"password`":`"replace-with-your-password`"}" http://localhost:4000/api/v1/auth/login
```

Before MFA is on, that is HTTP 200 and a `Set-Cookie: flowtop_session=...` header. After MFA is on, it is HTTP 200 with `requiresMfa` true and no session cookie.
