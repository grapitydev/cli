# @grapity/cli

Grapity CLI - the command line interface for the Grapity platform.

## Installation

```bash
npm install -g @grapity/cli
```

## Usage

```bash
# Configure registry (local or remote)
grapity registry init

# Start local server
grapity serve

# Push a spec
grapity registry push ./openapi.yaml --name payments-api

# List specs
grapity registry list

# Validate a spec
grapity registry validate ./openapi.yaml --against payments-api

# Deprecate a version
grapity registry deprecate payments-api@1.4.2 --sunset 2026-09-01
```

## License

Apache-2.0