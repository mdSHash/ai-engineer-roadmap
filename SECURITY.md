# Security Notes

## Threat model

This site is a **static-export Next.js build** hosted on GitHub Pages. There is **no production Next.js server** — the build output (`./out`) is plain HTML, CSS, and JavaScript. This eliminates entire classes of vulnerabilities that affect server-rendered Next.js apps.

## Authentication and progress storage

Authentication is **client-side only**, backed by `localStorage`:

- Passwords are hashed using **PBKDF2-SHA256 with a per-user 16-byte salt and 100 000 iterations**, via the Web Crypto API (`crypto.subtle`). Plaintext passwords are never stored.
- Sessions are tracked by user ID alone (no JWT, no remote token).
- All progress data is per-device. A user's progress only survives on the browser where they registered.
- The leaderboard ranks every user account that has ever registered on the current device.

This is intentional — the app runs without a backend. It is suitable for personal study and portfolio demonstration. It is **not** a multi-tenant production identity system.

## Reviewed risks

- **XSS**: no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `new Function()` usage. All user input is rendered through React's text-escaping pipeline.
- **Secrets in source**: no API keys, tokens, or credentials in the repository.
- **Build-time supply chain**: dependencies pinned to exact versions; `npm audit` clean of directly-applicable advisories after the most recent upgrade.

## Residual `npm audit` advisories

After upgrading to `next@14.2.35` and `postcss@8.5.15`, `npm audit` still flags several Next.js advisories. Each one applies only to runtime features that **are not used** in a static export:

| Advisory area | Used in this build? |
|---|---|
| `next/image` Image Optimizer | No — `images.unoptimized: true` |
| Server Components / RSC streaming | No — `output: 'export'` |
| Middleware / Proxy / Rewrites | No — none defined |
| WebSocket request handling | No |
| HTTP request smuggling in rewrites | No — no rewrites |
| CSP nonces | No |
| `beforeInteractive` Script | No |
| Pages Router i18n | No — App Router only |

Clearing these in the audit report would require bumping to Next 16, which forces React 19 and breaking App Router changes — disproportionate for a deployment model that is structurally not vulnerable.

## Reporting

For any genuine issue found, please open an issue at <https://github.com/mdSHash/ai-engineer-roadmap/issues>.
