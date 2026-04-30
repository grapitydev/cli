# @grapity/cli

Grapity CLI - the command line interface for the Grapity platform. Requires Node.js 18+.

## Installation

```bash
npm install -g @grapity/cli
```

To run a local registry server, also install the server package:

```bash
npm install -g @grapity/registry
```

## Setup

### Local mode (SQLite)

Run a registry server on this machine. No external dependencies.

```bash
npm install -g @grapity/cli @grapity/registry
grapity init --local
grapity serve
```

### Self-hosted (PostgreSQL)

```bash
npm install -g @grapity/cli @grapity/registry
grapity serve --db postgresql://user:pass@host:5432/grapity --auth jwt
```

### Remote / SaaS

Connect to a hosted Grapity instance. No server to run.

```bash
npm install -g @grapity/cli
grapity init --remote --url https://api.grapity.dev --api-key <key>
```

## Commands

### `grapity init`

Configure the registry. Writes `~/.grapity/config.yaml`.

```
--local               Use local mode (SQLite)
--remote              Use remote mode
--url <url>           Registry URL (required for remote)
--api-key <key>       API key (optional, for remote)
--port <port>         Port for local server (default: 3750)
--db <path>           SQLite database path (default: ~/.grapity/registry.db)
```

### `grapity serve`

Start the registry server. Requires `@grapity/registry` to be installed.

```
-p, --port <port>     Port to listen on (default: 3750)
--db <url>            SQLite path or postgresql:// URL
--auth <mode>         Auth mode: none | api-key | jwt (default: none)
```

The database backend is inferred from `--db`: a `postgresql://` URL uses PostgreSQL, anything else (or omitted) uses SQLite.

### `grapity registry push <file>`

Push a spec file to the registry. Validates structure, checks backward compatibility against the latest version, assigns a semver, and stores the result.

```
--name <name>         Spec name (required)
--type <type>         Spec type: openapi | asyncapi
--description <desc>  Description
--owner <owner>       Owner
--source-repo <url>   Source repository URL
--tags <tags>         Comma-separated tags
--git-ref <ref>       Git commit SHA
--pushed-by <by>      Pusher identity
--force               Force push even with breaking changes
--reason <reason>     Reason for force push (required with --force)
--prerelease          Use pre-release versioning (0.x)
```

Breaking changes block a push by default. Use `--force --reason <reason>` to override (recorded in the audit log).

### `grapity registry validate <file>`

Validate a spec against the latest version in the registry without storing anything. Returns the compatibility report.

```
--against <name>      Spec name to validate against (required)
```

### `grapity registry list`

List all specs in the registry.

```
--type <type>         Filter by spec type
--owner <owner>       Filter by owner
--tags <tags>         Comma-separated tag filter
```

### `grapity registry get <name>`

Get metadata and latest version details for a spec.

### `grapity registry versions <name>`

List all versions of a spec, newest first.

### `grapity registry spec <name>`

Fetch the raw spec document (OpenAPI/AsyncAPI file) for a spec. Prints to stdout, pipe-friendly.

```
--semver <semver>     Specific version (default: latest)
--format <format>     Output format: json or yaml (default: yaml)
```

Examples:

```bash
grapity registry spec payments-api                          # latest, yaml
grapity registry spec payments-api --format json            # latest, json
grapity registry spec payments-api --semver 1.2.0           # specific version
grapity registry spec payments-api --semver 1.2.0 | yq '.info.title'
```

## License

Apache-2.0
