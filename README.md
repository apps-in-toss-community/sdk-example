# sdk-example

Interactive SDK example app for `@apps-in-toss/web-framework`.

Lets you call every public API in the SDK directly from a browser — no Toss app required — using the `@ait-co/devtools` mock layer.

## Tech stack

- React 19 + TypeScript
- Vite + Tailwind CSS v4
- react-router-dom v7
- `@apps-in-toss/web-framework` (mocked via `@ait-co/devtools`)

## Getting started

```bash
pnpm install
pnpm dev        # starts dev server at http://localhost:5173
```

## Other commands

```bash
pnpm build      # type-check + production build → dist/
pnpm preview    # serve the production build locally
pnpm typecheck  # tsc --noEmit (no output = success)
```

## Links

- [`@apps-in-toss/web-framework`](https://github.com/apps-in-toss-community/web-framework)
- [`@ait-co/devtools`](https://github.com/apps-in-toss-community/devtools)
