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

# Get spec details
grapity registry get payments-api

# Validate a spec
grapity registry validate ./openapi.yaml --against payments-api
```

## License

Apache-2.0