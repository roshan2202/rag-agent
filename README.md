# Vercel RAG Agent

A simple file-based RAG assistant built with Next.js, TypeScript, and OpenRouter. Upload supported files, ask a question, and the app retrieves relevant chunks before sending a grounded prompt to a GPT mini model.

## Features

- Upload and parse TXT, Markdown, CSV, JSON, PDF, and DOCX files.
- Server-side ingestion through Next.js route handlers.
- Stateless, Vercel-friendly RAG flow: parsed documents are held in the browser and sent with each question.
- Lightweight lexical retrieval with source previews.
- OpenRouter chat completions using `openai/gpt-4o-mini` by default.
- Unit tests for retrieval, API ingestion, and the React frontend.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- OpenAI SDK configured for OpenRouter
- Vitest and Testing Library

## Local Setup

Create and use the Conda environment:

```powershell
conda create -n rag-agent-vercel nodejs=24.13.0
conda activate rag-agent-vercel
```

Install dependencies:

```powershell
npm install
```

Create a local environment file:

```powershell
Copy-Item .env.example .env.local
```

Set your OpenRouter key in `.env.local`:

```text
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run the app:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```powershell
npm run dev
npm test
npm run lint
npm run build
```

## Deployment on Vercel

1. Push the project to GitHub.
2. Import the GitHub repo in Vercel.
3. Add environment variables in Vercel Project Settings:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL` such as `openai/gpt-4o-mini`
   - `NEXT_PUBLIC_APP_URL` with your deployed URL
4. Deploy.

You can also deploy from the CLI:

```powershell
npx vercel
npx vercel env add OPENROUTER_API_KEY production
npx vercel env add OPENROUTER_MODEL production
npx vercel --prod
```

## Notes

This project intentionally avoids committing `.env` files. `requirements.txt` is included because this was created in a Conda workflow, but runtime packages are Node dependencies listed in `package.json`.
