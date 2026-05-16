# TwoNote (OneNote Evolution Prototype)

TwoNote is a canvas-first, desktop note-taking prototype built with **React + TypeScript + Vite + Tauri**.

It currently focuses on fast note placement and rich-text editing on an infinite-style board.

## Current Features

- Infinite-style scrollable canvas with background grid
- Double-click anywhere on the canvas to create a new note container
- Rich text editing (TipTap):
  - Bold, italic, strikethrough
  - Heading, bullet list, task list
  - Text color, highlight, alignment, font family
- Drag note containers by their handle
- Delete notes
- **New note button** in the header
- **Selection-aware delete** (Delete / Backspace on selected note)
- **Undo delete** via button or Ctrl/Cmd + Z
- **Duplicate selected note** action
- **Search notes** by title or content
- Local persistence of note containers (position, title, and content) using `localStorage`

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Editor: TipTap
- Desktop shell: Tauri 2 (Rust backend)
- Tests: Vitest + Testing Library
- Linting/formatting: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- Rust toolchain (for Tauri desktop builds/runs)
- Tauri system dependencies for your OS

### Install

```bash
npm install
```

### Run in development (web)

```bash
npm run dev
```

### Run as Tauri desktop app

```bash
npm run tauri dev
```

## Validation Commands

```bash
npm run lint
npm run build
npm run test
```

## Project Structure

- `/src` — React UI
  - `App.tsx` — canvas state and top-level interactions
  - `/components` — canvas, note container, and toolbar UI
- `/src-tauri` — Rust + Tauri desktop integration
- `ROADMAP.md` — technical roadmap and phased goals

## Roadmap Highlights

Planned directions include:

- Better UX smoothness and animation polish
- Undo/redo expansion across all canvas actions
- Better organization features (notebooks/sections/pages)
- Sync and Office ecosystem integration (long-term)

See `ROADMAP.md` for details.
