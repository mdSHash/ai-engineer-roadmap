# AI Engineer Roadmap

> A learning platform for beginner to mid-level AI engineers — focused on the **decisions** that matter in interviews and production, not the syntax of any framework.

Modern AI interviews don't ask you to write code; they ask you to defend choices. *When should we use RAG? Which vector database? How would you chunk this corpus? Where is the bottleneck?* This site is the playbook.

---

## What's inside

- **8 curriculum modules** — RAG, vector databases, chunking, token economics, prompting AI for code, bottleneck investigation, evaluation, and the full AI engineering lifecycle.
- **46 interview scenarios** — real questions with model answers, trade-offs, red flags, and likely follow-up probes.
- **3 interactive decision trees** — walk through "Should I use RAG?", "Which vector DB?", and "Which chunking strategy?" and arrive at a senior-grade recommendation.
- **42 flashcards** — high-leverage facts you'll be asked, organized by topic.
- **8 module quizzes** — 40 questions total, each with a written explanation of why the right answer is right.
- **Account system + progress tracking** — register, sign in, and your progress is saved per-account. It only resets when you reset it.
- **Leaderboard** — see who is ahead on the roadmap.

Every section is opinionated: it tells you what a *senior* answer sounds like and what flags an answer as junior.

## Authentication & data

Auth is **client-side only**, backed by `localStorage`. Passwords are hashed with **PBKDF2-SHA256 (100 000 iterations) + per-user salt** via the Web Crypto API; plaintext passwords are never stored. Progress is stored per-account in the same browser. See [`SECURITY.md`](./SECURITY.md) for the threat model and known limitations.

---

## Tech stack

- **Next.js 14** (App Router, static export)
- **TypeScript** (strict)
- **Tailwind CSS** (custom dark editorial theme)
- **Framer Motion** (page + component transitions)
- **lucide-react** (icons)

The site is statically rendered and hosted on **GitHub Pages**. No backend, no database, no analytics — just content and interactivity.

---

## Local development

```bash
npm install
npm run dev
```

The site is available at <http://localhost:3000>.

To produce a production build matching what GitHub Pages serves:

```bash
GITHUB_PAGES=true npm run build
npx serve out
```

The static output lives in `./out`.

---

## Project structure

```
ai-roadmap/
├── app/                          App Router pages
│   ├── modules/[slug]/           Module detail pages (RAG, chunking, ...)
│   ├── quiz/[slug]/              Per-module quizzes
│   ├── decision-trees/[slug]/    Interactive decision-tree runner
│   ├── flashcards/               Flashcard deck
│   ├── interview/                Searchable scenario bank
│   ├── login/                    Sign-in page
│   ├── register/                 Sign-up page
│   ├── profile/                  Personal progress dashboard
│   ├── leaderboard/              Cross-account leaderboard
│   └── page.tsx                  Home
├── components/                   UI primitives + interactive components
│   ├── nav.tsx
│   ├── auth-provider.tsx
│   ├── auth-form.tsx
│   ├── module-content.tsx
│   ├── quiz.tsx
│   ├── flashcard.tsx
│   ├── decision-tree.tsx
│   └── interview-explorer.tsx
├── lib/
│   ├── content/                  All curriculum + Q&A data
│   │   ├── rag.ts
│   │   ├── vector-databases.ts
│   │   ├── chunking.ts
│   │   ├── token-optimization.ts
│   │   ├── prompting-for-code.ts
│   │   ├── bottlenecks.ts
│   │   ├── evaluation.ts
│   │   ├── lifecycle.ts
│   │   ├── interview-questions.ts
│   │   ├── flashcards.ts
│   │   ├── decision-trees.ts
│   │   └── quizzes.ts
│   ├── auth.ts                   Client-side auth + password hashing
│   ├── use-progress.ts           Progress + leaderboard hooks
│   ├── types.ts
│   └── utils.ts
├── public/
└── .github/workflows/deploy.yml  GitHub Pages deployment
```

Content is plain TypeScript modules — adding a question, a flashcard, or a tree branch means editing one typed file and committing.

---

## Deployment

The site auto-deploys to GitHub Pages on every push to `main` via the workflow at `.github/workflows/deploy.yml`. The workflow:

1. Installs dependencies (`npm ci`)
2. Builds with `GITHUB_PAGES=true` so the configured `basePath` matches the Pages URL
3. Uploads `./out` as the Pages artifact
4. Deploys via `actions/deploy-pages`

To deploy a fork, enable GitHub Pages in the repository settings (`Settings → Pages → Source: GitHub Actions`).

---

## Design notes

The aesthetic is intentional: dark, editorial, terminal-credible. A single sharp accent (lime) signals interactivity; serif display sets the tone; mono communicates engineering. No purple gradients, no card-grid slop. The whole thing should feel like something an AI engineer would put on their CV — not something an AI generated for them.

---

## License

MIT

---

## Author

**Mostafa Hashem**
[mostafa20171701097@cis.asu.edu.eg](mailto:mostafa20171701097@cis.asu.edu.eg) · [@mdSHash](https://github.com/mdSHash)
