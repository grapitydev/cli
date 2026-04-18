# Contributing to @grapity/cli

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- Node.js >= 18

## Setup

```bash
bun install
```

## Commands

```bash
bun run typecheck   # Type check
bun run build       # Build dist/
bun test            # Run tests
bun run dev         # Run CLI locally
```

## Local Development

The Grapity platform has three independent repos that depend on each other:

```
@grapity/core  ←  @grapity/registry  ←  @grapity/cli (peer dep)
```

### Linking all packages

The cli uses `link:` protocol in package.json to resolve local @grapity/core and @grapity/registry. This is the Bun-native approach for monorepo-like linking without a workspace.

```bash
# 1. Build core
cd ~/workspace/grapity/core
bun install && bun run build
bun link

# 2. Build registry
cd ~/workspace/grapity/registry
bun install
bun run build
bun link

# 3. Install cli (resolves both via link:)
cd ~/workspace/grapity/cli
bun install
bun run build
```

No `bun link @grapity/core` step needed. The `link:` protocol in package.json handles resolution automatically.

### Checking link status

```bash
ls -la node_modules/@grapity/core
# Symlink: node_modules/@grapity/core -> /Users/you/workspace/grapity/core
# npm:      node_modules/@grapity/core/  (regular directory)
```

### Unlinking (restore npm versions)

Before pushing changes that affect package.json, revert `link:` references to version ranges:

```json
// Change in package.json before pushing:
"@grapity/core": "^0.0.1",           // ← npm version range
"@grapity/registry": "^0.0.1",       // ← npm version range
// NOT:
"@grapity/core": "link:@grapity/core",           // ← local dev only
"@grapity/registry": "link:@grapity/registry",   // ← local dev only
```

The CI pipeline publishes to npm and expects version ranges, not `link:` references.

### After changes in core or registry

```bash
# Rebuild the changed package
cd ~/workspace/grapity/core   # or registry
bun run build   # link: references pick up changes via symlink.
```

### Testing the full flow

```bash
# Terminal 1: Start the registry server
cd ~/workspace/grapity/registry
bun run dev

# Terminal 2: Use the CLI
cd ~/workspace/grapity/cli
bun run dev registry init --local
bun run dev registry push ./openapi.yaml --name my-api
bun run dev registry list
```

## Publishing

Publishing is handled by GitHub Actions. Do not publish manually.

## License

Apache-2.0