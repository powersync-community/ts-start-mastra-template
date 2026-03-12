# TanStack Start + PowerSync + Mastra Chat App

A real-time chat app with AI responses, offline-first local storage, and automatic sync. Built with TanStack Start, PowerSync, and Mastra.

## Stack

- **TanStack Start** — React framework with file-based routing and server functions
- **PowerSync** — Offline-first sync engine (SQLite on client, Postgres on server)
- **Mastra** — AI agent framework (uses OpenRouter / MiniMax M2.5 for responses)
- **Postgres** — Source database for messages
- **MongoDB** — PowerSync internal storage

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- An [OpenRouter](https://openrouter.ai/) API key

## Setup

1. **Clone and install dependencies:**

```bash
git clone <repo-url> && cd chat-app
npm install
```

2. **Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and set your `OPENROUTER_API_KEY`. The other defaults work with the Docker Compose setup:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/chat` | Postgres connection string |
| `POWERSYNC_URL` | `http://localhost:8080` | PowerSync service endpoint |
| `JWT_SECRET` | `my-powersync-dev-jwt-secret-key!` | Shared secret for PowerSync JWT auth |
| `OPENROUTER_API_KEY` | — | Your OpenRouter API key |

3. **Start infrastructure (Postgres, MongoDB, PowerSync):**

```bash
npm run start:docker
```

4. **Start the dev server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. User sends a message — it's written to the local SQLite database via PowerSync.
2. PowerSync syncs the write to Postgres in the background.
3. A TanStack server function sends the conversation history to the Mastra AI agent.
4. The AI response is written back to local SQLite, then synced to Postgres.
5. All messages stay available offline and sync automatically when connectivity returns.

## Project Structure

```
├── src/
│   ├── routes/index.tsx       # Chat UI component
│   ├── lib/
│   │   ├── server-fns.ts      # Server functions (AI chat, PowerSync auth, data upload)
│   │   ├── connector.ts       # PowerSync backend connector
│   │   └── schema.ts          # PowerSync client schema
│   └── router.tsx             # TanStack router setup
├── powersync/
│   ├── sync-config.yaml       # Sync rules (which tables/columns to sync)
│   └── service.yaml           # PowerSync service configuration
├── init.sql                   # Database schema (messages table + replication)
├── docker-compose.yml         # Postgres, MongoDB, PowerSync services
└── start.sh                   # Helper to start Docker services
```

## Tests

End-to-end tests use Playwright:

```bash
npx playwright test
```