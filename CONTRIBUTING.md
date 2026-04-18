# Contributing to @grapity/cli

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- Node.js >= 18 (for type checking)

## Setup

```bash
bun install
```

## Development

```bash
# Type check
bun run typecheck

# Build
bun run build

# Run tests
bun run test

# Run CLI locally
bun run dev registry list
```

## Local Linking for Development

@grapity/cli depends on @grapity/core (hard dependency) and @grapity/registry (peer dependency, for `grapity serve`).

```bash
# First, link core and registry (one time)
cd ../core && bun run build && bun link
cd ../registry && bun run build && bun link

# Then, in this repo (cli/)
bun link @grapity/core
bun link @grapity/registry
bun install
```

**Always unlink before pushing:**

```bash
bun unlink @grapity/core
bun unlink @grapity/registry
bun install
```

Check if a link is active:

```bash
ls -la node_modules/@grapity/core
ls -la node_modules/@grapity/registry
# A symlink shows the target path
```

## Testing the Full Flow

```bash
# Terminal 1: Start the registry server
cd ../registry
bun run dev

# Terminal 2: Use the CLI
bun run dev registry init --local
bun run dev registry push ./openapi.yaml --name my-api
bun run dev registry list
```

## Publishing

Publishing is handled by GitHub Actions. Do not publish manually.

## License

Apache-2.0