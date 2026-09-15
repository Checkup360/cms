# Checkup360 CMS

Headless Content Management System (CMS) for **Checkup360**, built on **Payload CMS 3.x** and **Next.js** (App Router) backed by **PostgreSQL**.

It manages preventive health content, informative medical articles, author profiles, and media assets consumed by the Checkup360 client applications (primarily the member portal).

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router) & React 19
- **Headless CMS:** [Payload CMS 3.88+](https://payloadcms.com/)
- **Database:** PostgreSQL with `@payloadcms/db-postgres`
- **Rich Text Editor:** Lexical (`@payloadcms/richtext-lexical`)
- **Package Manager:** [pnpm](https://pnpm.io/) (v9+)
- **Testing:** Vitest (integration tests) and Playwright (E2E tests)

---

## Prerequisites

- **Node.js**: `^18.20.2` or `>=20.9.0`
- **pnpm**: `^9.0.0` (or higher)
- **PostgreSQL**: A running instance (local or Docker on port `5432`).

---

## Getting Started

### 1. Install Dependencies

```bash
cd cms
pnpm install
```

### 2. Environment Variables

Copy the example environment file and configure your local settings (each variable is documented inside `.env.example`):

```bash
cp .env.example .env
```

### 3. Run Database Migrations

Ensure PostgreSQL is reachable, then run the Payload database migrations:

```bash
pnpm migrate
```

---

## Development Server

Start the Next.js / Payload development server:

```bash
pnpm dev
```

> **Tip:** If you encounter Next.js cache or build type inconsistencies, run:
> ```bash
> pnpm devsafe
> ```

The service will be available at:
- **Admin Panel UI:** `http://localhost:3000/admin`
- On initial launch, Payload will prompt you to create your first admin user.

---

## Collections

Defined under `src/collections/`:

- **Pages (`Pages.ts`):** Educational and preventive health articles consumed by the web portal.
- **Authors (`Authors.ts`):** Profiles for medical professionals and content creators.
- **Media (`Media.ts`):** Uploads, focal point selection, and responsive image resizing.
- **Users (`Users.ts`):** Admin accounts authenticated to manage the CMS.

---

## Testing and Code Quality

```bash
# Static type checking
pnpm typecheck

# Linter (ESLint)
pnpm lint

# Integration tests (Vitest)
pnpm test:int

# End-to-End tests (Playwright)
pnpm test:e2e

# Run all precommit checks (lint + typecheck + test:int)
pnpm precommit
```

---

## Production Build

```bash
pnpm build
pnpm start
```

---

## Releases

Tagging a commit with a semantic version (e.g., `git tag v0.2.0 && git push origin v0.2.0`) automatically triggers the GitHub Actions workflow to build and publish the container image to GitHub Container Registry (GHCR).
