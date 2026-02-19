# Akamai Image Manager Demo

Interactive demo application showcasing Akamai's edge delivery platform — Image Manager, EdgeWorkers, DataStream 2, CCU/Fast Purge, and full Terraform IaC.

## What This Demonstrates

| Section | Akamai Products | What It Shows |
|---------|----------------|---------------|
| **Media Transformation** | Image Manager | One master asset delivered as device-optimized variants (WebP, AVIF, Retina) via `imwidth`, `imdensity`, `impolicy` query parameters |
| **Observability** | DataStream 2 | Real-time request-level telemetry streamed via webhook to a live dashboard over Socket.IO |
| **Asset Governance** | CCU / Fast Purge | Sub-5-second cache invalidation with image replacement — no URL changes required |
| **Edge Logic** | EdgeWorkers, Functions | Multi-CDN audit headers, QA cache bypass, origin shield for high-traffic events |
| **Performance** | CDN Delivery, CloudWrapper | Latency benchmarking with and without CloudWrapper mid-tier caching (Cache+ IM derivative persistence) |

## Architecture

```
┌─────────────────┐       ┌──────────────────────────┐       ┌─────────────────┐
│   React SPA     │──────▶│    Akamai Edge Platform   │──────▶│  Origin Server  │
│   (Vite)        │       │                          │       │  (Express +     │
│                 │       │  ┌──────────────────┐    │       │   Socket.IO)    │
│  - IM controls  │       │  │ Image Manager    │    │       │                 │
│  - DS2 dashboard│       │  │ EdgeWorkers      │    │       │  - Purge API    │
│  - Purge UI     │       │  │ DataStream 2     │    │       │  - DS2 webhook  │
│  - Latency test │       │  │ CloudWrapper     │    │       │  - Perf proxy   │
│                 │       │  └──────────────────┘    │       │  - Governance   │
└─────────────────┘       └──────────────────────────┘       └─────────────────┘
                                                                      │
                          ┌──────────────────────────┐                │
                          │  Terraform IaC            │────────────────┘
                          │  (all resources defined)  │
                          └──────────────────────────┘
```

## Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Recharts, Socket.IO client
- **Backend**: Express 4, Socket.IO, Akamai EdgeGrid SDK
- **Edge**: EdgeWorkers (JavaScript), Image Manager policies
- **IaC**: Terraform with `akamai/akamai` provider

## Quick Start

### Prerequisites

- Node.js 20+
- Akamai EdgeGrid credentials (`~/.edgerc`) with Property Manager, CCU, EdgeWorkers, and Image Manager APIs
- Terraform 1.5+ (for infrastructure provisioning)

### Local Development

```bash
# Clone
git clone https://github.com/ccie7599/akamai-im-demo.git
cd akamai-im-demo

# Install dependencies (frontend + server)
npm install

# Configure environment
cp .env.example .env
# Edit .env with your hostnames, EdgeGrid config, and auth token

# Start both frontend and backend
npm run dev:all
```

The frontend runs on `http://localhost:5173` with API requests proxied to the Express backend on port 3001.

### Generate an Auth Token

```bash
python3 -c "import secrets; print(secrets.token_urlsafe())"
```

Set the output as both `API_AUTH_TOKEN` and `VITE_AUTH_TOKEN` in `.env`.

## Terraform Resources

All infrastructure is defined in `terraform/` — no manual console configuration required.

| File | Resource | Purpose |
|------|----------|---------|
| `main.tf` | Provider config | Akamai EdgeGrid provider setup |
| `variables.tf` | Input variables | All configurable values (hostnames, IDs, credentials) |
| `cp_code.tf` | `akamai_cp_code` | Content Provider code for traffic reporting |
| `edge_hostname.tf` | `akamai_edge_hostname` | Edge hostname (`.edgesuite.net`) with Default DV TLS |
| `property.tf` | `akamai_property` | Ion Standard property with rule tree |
| `rules.tf` | `akamai_property_rules_builder` | Full rule tree — IM behaviors, EdgeWorker, caching, DS2 |
| `activation.tf` | `akamai_property_activation` | Staging + production activation with compliance record |
| `edgeworker.tf` | `akamai_edgeworker` | EdgeWorker registration, bundle upload, and activation |
| `imaging.tf` | `akamai_imaging_policy_set` + policies | IM policy set with quality presets (low/medium/high/pristine) |
| `dns.tf` | `akamai_dns_record` | CNAME for edge hostname + A record for origin |
| `cps.tf` | Notes | Default DV certificate (managed by Property Manager) |
| `datastream.tf` | `akamai_datastream` (commented) | DataStream 2 to webhook — uncomment to enable |
| `outputs.tf` | Outputs | Property ID, EdgeWorker ID, CP code for `.env` |

### Deploy Infrastructure

```bash
cd terraform

# Create terraform.tfvars with your values
cat > terraform.tfvars <<'EOF'
contract_id          = "ctr_M-XXXXXXX"
group_id             = "grp_XXXXXX"
notification_emails  = ["you@example.com"]
origin_ip            = "1.2.3.4"
debug_key            = "your-64-char-hex-string"

# Override defaults if using your own domain:
# property_name      = "demo.yourdomain.com"
# origin_hostname    = "origin-demo.yourdomain.com"
# edge_hostname      = "demo.yourdomain.com.edgesuite.net"
# dns_zone           = "yourdomain.com"
# dns_hostname_prefix = "demo"
EOF

terraform init
terraform plan
terraform apply
```

Terraform outputs include the EdgeWorker ID and CP code — add these to your `.env`.

## EdgeWorker

The bundled EdgeWorker (`edgeworker/`) runs on every request through the Akamai property and provides:

1. **Multi-CDN audit headers** — `X-CDN-Provider`, `X-Request-Trace-ID`, `X-Edge-Timestamp` on every response for analytics attribution
2. **QA cache bypass** — Send `X-QA-Token` header to get a guaranteed cache MISS for image preview verification
3. **Origin shield** — `X-Sale-Event` header triggers `PMUSER_ORIGIN_SHIELD` variable for Property Manager TTL extension during high-traffic events

## Origin Server

The Express backend provides:

| Route | Purpose |
|-------|---------|
| `GET /api/health` | Health check (no auth) |
| `POST /api/ds2/webhook` | DataStream 2 log receiver (Basic Auth) |
| `POST /api/ccu/*` | Fast Purge proxy (EdgeGrid) |
| `GET /api/edgeworkers/*` | EdgeWorker version info |
| `GET /api/performance/probe` | Latency measurement proxy |
| `POST /api/governance/*` | Image replacement workflow |

All routes except health and DS2 webhook require `?auth=<token>` query parameter.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `CORS_ORIGIN` | No | Allowed CORS origin (default: `http://localhost:5173`) |
| `EDGERC_PATH` | No | Path to EdgeGrid credentials (default: `~/.edgerc`) |
| `EDGERC_SECTION` | No | EdgeGrid config section (default: `default`) |
| `API_AUTH_TOKEN` | Yes | Token for API route authentication |
| `VITE_AUTH_TOKEN` | Yes | Same token, exposed to frontend |
| `VITE_AKAMAI_HOST` | Yes | Akamai property hostname |
| `VITE_ORIGIN_HOST` | Yes | Origin server hostname |
| `AKAMAI_PROPERTY_HOSTNAME` | No | Property hostname for server-side calls |
| `AKAMAI_EDGEWORKER_ID` | No | EdgeWorker ID (from `terraform output`) |
| `AKAMAI_CP_CODE` | No | CP code (from `terraform output`) |
| `DS2_WEBHOOK_USERNAME` | No | DataStream 2 webhook Basic Auth user |
| `DS2_WEBHOOK_PASSWORD` | No | DataStream 2 webhook Basic Auth password |

## Production Deployment

1. **Provision infrastructure**: `terraform apply` in `terraform/`
2. **Build frontend**: `npm run build` (outputs to `dist/`)
3. **Build server**: `npm run build:server` (compiles TypeScript to `server/dist/`)
4. **Origin setup**: Nginx reverse proxy → Node.js process, TLS via Let's Encrypt
5. **DNS**: Terraform creates the CNAME and A records automatically
6. **Verify**: Hit your Akamai hostname — check for `X-CDN-Provider: akamai` response header

## License

Apache 2.0 — see [LICENSE](LICENSE).
