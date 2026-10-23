# Session cookie across sites

The session cookie is `httpOnly`, `Secure`, `SameSite=Lax`, path `/`, and host-only: no `Domain` attribute. It is set in `backend/src/auth/session-cookie.ts`.

`onrender.com` is on the Public Suffix List. `flowtop-admin.onrender.com` and `flowtop-api.onrender.com` are different sites, not two hosts of one site. A `SameSite=Lax` cookie set by the API is not sent on a fetch from the admin. The admin then sees 401 on every call and redirects to login forever. The cookie was set. The browser is doing what Lax means.

Localhost is not this case. `http://localhost:3001` and `http://localhost:4000` are the same site (the port does not count), so Lax still sends the cookie and local admin development works.

The default stays Lax and host-only. Two environment variables can change it. Unset, they are exactly that default.

| Variable | Default | Allowed |
|---|---|---|
| `SESSION_COOKIE_SAME_SITE` | `lax` | `lax`, `strict`, `none` |
| `SESSION_COOKIE_DOMAIN` | unset (no Domain attribute) | a hostname, optionally starting with a dot, such as `.flowtop.in` |

`Secure` stays on either way. Browsers reject `SameSite=None` without `Secure`.

## (a) Custom domains. Strongest.

Serve the admin at `admin.flowtop.in` and the API at `api.flowtop.in`.

Both names are under the registrable domain `flowtop.in`, so they are the same site. `SameSite=Lax` then sends the cookie on the admin's fetches to the API. Leave `SESSION_COOKIE_SAME_SITE` unset. Leave `SESSION_COOKIE_DOMAIN` unset too: the cookie only needs to go back to `api.flowtop.in`, which a host-only cookie already does.

This keeps Lax's cross-site protection. A random website cannot attach the session to a request. This is the option to use if we control DNS.

## (b) `SameSite=None; Secure`. Works on any host. Weaker.

Set `SESSION_COOKIE_SAME_SITE=none`. The browser will send the cookie on cross-site fetches, including from one `onrender.com` subdomain to another, as long as the request is HTTPS (`Secure` is already set).

That also sends the cookie on a request any other website can start. Lax was what stopped that. CORS has to refuse every origin except the admin and the public site, and `credentials` stays on so the browser is allowed to attach the cookie. The API already reflects `CORS_ORIGINS` and enables credentials. An origin that is not on that list must not be added to make a browser extension or a preview URL work. `None` plus a loose CORS list is a session that other sites can exercise.

Do not set `Domain` to `.onrender.com`. The public suffix list blocks it, and it would be the wrong scope even if it worked.

## Staging as configured now

`infra/render.yaml` names the API service `flowtop-api-staging` and does not set a custom domain. Render's default hostname for that service is `flowtop-api-staging.onrender.com`, which is also the health URL in `infra/README.md`. `CORS_ORIGINS` and `ADMIN_URL` are `sync: false`: the blueprint does not record the admin hostname. There is no admin service in the blueprint.

The cookie variables are not set in the blueprint, so staging runs the default: `SameSite=Lax`, host-only. The moment the admin is opened from a different `*.onrender.com` host and calls that API, the Lax cookie is not sent and login loops. The blueprint does not turn on option (a) or option (b).
