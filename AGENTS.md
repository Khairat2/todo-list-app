<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules --><!-- END:nextjs-agent-rules -->

# Project Overview
This repository is a To-Do List app project built with Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4.

## Project Structure
- `app/page.tsx` is the home page; `app/layout.tsx` defines the root layout and metadata.
- `app/globals.css` imports Tailwind CSS and contains global styles and theme variables.
- Put route UI and any needed components under `app/`; put static assets in `public/`.
- Root-level files configure Next.js, TypeScript, ESLint, and PostCSS. `README.md` contains the starter project notes.

## Development Commands
- Install dependencies: `npm install`
- Start the development server: `npm run dev`
- Build for production: `npm run build`
- Run the production server after building: `npm run start`
- Run lint checks: `npm run lint`

## Coding Guidelines
- Follow the existing TypeScript and Next.js conventions; TypeScript strict mode is enabled and `@/*` maps to the repository root.
- Keep code simple, readable, and maintainable. Reuse existing patterns before introducing new ones.
- Use the existing Tailwind CSS setup and avoid unnecessary dependencies.
- Do not modify core configuration unless necessary.

## Verification
- Run `npm run lint` and `npm run build` after relevant changes. No test script is currently defined in `package.json`.
- Confirm the app starts with `npm run dev` when runtime behavior needs verification; do not claim checks passed unless they were run successfully.

## AI Agent Guidelines
- Read `AGENTS.md` and inspect relevant existing files before making changes.
- Make focused changes; preserve existing functionality unless the task requires changing it.
- Explain important assumptions and report which checks were run and their results.
