# FlowTop

## Secret scanning: set this up once after cloning

Every commit is scanned for secrets (passwords, API keys, tokens, connection strings) before it is created. A commit that contains one is blocked on your machine, so it never reaches GitHub. CI runs the same scan on every pull request, so a clone without the hook is still caught there, just later and more publicly.

**1. Install gitleaks.**

| OS | Command |
|---|---|
| Windows | `winget install Gitleaks.Gitleaks` |
| macOS | `brew install gitleaks` |
| Linux | `brew install gitleaks`, or download the binary for your platform from the [gitleaks releases](https://github.com/gitleaks/gitleaks/releases) and put it on your `PATH` |

Open a new terminal afterwards (and restart VS Code if you commit from it), then check it works:

```sh
gitleaks version
```

**2. Turn on the hook.** From the repo root:

```sh
git config core.hooksPath .githooks
```

This is per clone, so run it again if you clone the repo somewhere else.

**If a commit is blocked:** the output shows the file, line and rule, with the value redacted.

- If it is a real secret, remove it and tell Dev A so it can be rotated. Deleting it in a later commit is not enough, because it stays in git history.
- If it is a test value, generate it at runtime instead of writing it in the source.

Do not bypass the hook with `--no-verify`. The rules live in `.gitleaks.toml`, and reviewed false positives in git history are listed in `.gitleaksignore`.

## Deploying the API anywhere other than Render: check `TRUST_PROXY_HOPS`

`TRUST_PROXY_HOPS` tells the API how many proxies sit in front of it, so it can read the real client IP from the `X-Forwarded-For` header. Every per-IP rate limit (sign-in, MFA sign-in, password reset, public settings) keys on that IP.

- **On Render it must be `1`**, and `infra/render.yaml` sets it. Render's proxy adds the real IP to the header; without the setting, every visitor shares the proxy's IP, so ten sign-in attempts a minute from anyone at all rate-limit everyone.
- **On a host with no proxy in front, it must be `0`** (the default). Set to `1` there, the API believes whatever `X-Forwarded-For` the client sends. A client can then send a different made-up IP on every request and is never rate limited per IP. The per-account limits (5 wrong passwords or MFA codes per account in 15 minutes) still hold, but one client can try passwords against every account at once, and request password-reset emails for every account and flood the public endpoints.
- **Behind more than one proxy** (for example a CDN in front of a load balancer), set it to the exact number of proxies, never more.

The rule: the number must equal the proxies you control between the internet and the API. Too low breaks rate limits for everyone; too high lets anyone bypass them.
