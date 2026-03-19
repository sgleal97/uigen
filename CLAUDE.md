# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup
npm run setup          # install deps + prisma generate + migrate

# Development
npm run dev            # Next.js dev server with Turbopack
npm run build          # Production build
npm run lint           # ESLint

# Testing
npm test               # Vitest (run all tests)
npx vitest run <file>  # Run a single test file

# Database
npx prisma generate    # Regenerate Prisma client after schema changes
npx prisma migrate dev # Apply migrations
npm run db:reset       # Reset database (destructive)
```

`NODE_OPTIONS="--require ./node-compat.cjs"` is injected by all npm scripts via `cross-env` — this is required for bcrypt compatibility on Node 18+.

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface and Claude generates the code; the result is previewed immediately in a sandboxed iframe.

### Request Flow

1. User sends a message → `POST /api/chat` (streaming)
2. The API route streams a response from `claude-sonnet-*` via `@ai-sdk/anthropic`
3. Claude calls tools (`str_replace_editor`, `file_manager`) to write/update files
4. Tool calls are forwarded to the client via the AI SDK's streaming protocol
5. The client's `FileSystemContext` applies the changes to the in-memory virtual file system
6. The `PreviewFrame` picks up file changes, transpiles the JSX via Babel standalone, and re-renders the iframe

### Virtual File System

All generated code lives **only in memory** — nothing is written to disk. `src/lib/file-system.ts` implements the `VirtualFileSystem` class. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) wraps it as a React context and is the single source of truth for open files. File contents are serialized and stored in the `Project.data` database column when a project is saved.

### Preview Rendering

`src/components/preview/preview-frame.tsx` renders generated components by:
1. Locating the entry point (`App.jsx`, `App.tsx`, `index.jsx`, or `index.tsx`)
2. Transpiling all virtual files using Babel (via `src/lib/transform/jsx-transformer.ts`)
3. Creating an import map pointing React/ReactDOM to `esm.sh` CDN
4. Writing blob URLs into a sandboxed iframe with the React 19 automatic JSX runtime

### AI Tool Definitions

`src/lib/tools/` contains the Vercel AI SDK tool definitions:
- `str_replace_editor` — create/read/update files via targeted string replacement
- `file_manager` — create/delete/rename files and directories

System prompts live in `src/lib/prompts/`.

### Mock Language Model

When `ANTHROPIC_API_KEY` is absent, `src/lib/provider.ts` returns a `MockLanguageModel` that simulates tool calls and generates demo components (Counter, ContactForm, Card). This lets the UI run without credentials.

### Authentication

JWT-based auth via `jose`. Passwords hashed with bcrypt. `src/lib/auth.ts` handles token creation/verification. Server actions in `src/actions/` (`signUp`, `signIn`, `signOut`, `getUser`) are the only way to mutate auth state. Middleware (`src/middleware.ts`) guards `/api/projects` and `/api/filesystem` routes.

### Database

SQLite via Prisma. **Always reference `prisma/schema.prisma` to understand the structure of data stored in the database.** Generated client output: `src/generated/prisma`. Two models: `User` and `Project` (stores chat `messages` as JSON and file system `data` as JSON). Projects can be anonymous (no `userId`).

### Layout

`src/app/main-content.tsx` renders the three-panel layout:
- **Left (35%)**: `ChatInterface` — message list + input
- **Right (65%)**: Tabs — `PreviewFrame` | `FileTree` + Monaco `CodeEditor`

State is managed via two contexts: `ChatContext` and `FileSystemContext`.

## Code Style

Use comments sparingly. Only comment complex code.

## Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json` and `components.json`).

## UI Components

shadcn/ui components (new-york style) live in `src/components/ui/`. Add new ones with `npx shadcn@latest add <component>`.
