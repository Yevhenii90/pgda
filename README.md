# Decision Debugger

A minimal structured decision analysis tool built with Next.js, React, TypeScript, Tailwind CSS, and the App Router.

## What It Does

- Accepts a decision and optional context.
- Lets the user choose an analysis mode: Balanced, Critical, Practical, or Fast check.
- Calls `/api/analyze` for a structured LLM response.
- Validates the JSON response before rendering.
- Stores the last 10 successful analyses in `localStorage`.
- Lets users reopen, delete, and copy previous results.

## Local Setup

Create `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
```

Optional:

```bash
OPENAI_MODEL=gpt-4.1-mini
```

Install dependencies and run the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```
