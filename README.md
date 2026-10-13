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
