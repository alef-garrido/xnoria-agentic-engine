# OpenClaw — Deployment & Security Reference

> Internal reference for the Exnoria project.  
> Source: OpenClaw security deployment guide (video transcript).  
> Purpose: Inform the design of the Exnoria cognitive layer instance.

---

## What OpenClaw is

OpenClaw is an agent runtime — not a prompt-response system. It runs a persistent gateway process that:

- Listens for incoming messages from channels (Telegram, WhatsApp, Discord)
- Routes them to an LLM (Claude, GPT, Gemini, etc.)
- Executes the model's decisions via tools (shell commands, file access, browser control, message sending)
- Maintains context across sessions

The gateway runs on port `18789` by default. A secondary port `18790` is also used internally.

---

## Architecture overview

```
Incoming message (Telegram / WhatsApp / Discord)
        │
        ▼
  Gateway (port 18789)
        │
        ▼
  LLM (Claude / GPT / Gemini / etc.)
        │
        ▼
  Tool execution
  (shell · files · browser · messages)
```

### Three security zones

| Zone | Component | Risk if exposed |
|---|---|---|
| 1 | Gateway (port 18789) | Full bot access without authentication |
| 2 | Channels (Telegram, WhatsApp) | Anyone can send messages and manipulate the bot |
| 3 | Bot tools | Shell, file manipulation, message sending — full system compromise |

> Note: As of the time of this guide, 30,000+ OpenClaw instances were publicly exposed on the internet without authentication.

---

## Known vulnerabilities and patches

| ID | Description | Fixed in |
|---|---|---|
| Volume 210 | npm scripts hidden in skills execute malware on install | Avoid Claw Hub skills until patched |
| VAN 188 | Logic bug allows anyone to gain admin permissions without authentication | `v2026129` (released Jan 30) |

**Check your version:**

```bash
openclaw --version
```

**Update if below `v2026129`:**

```bash
docker compose pull openclaw_gateway
docker compose up -d
```

---

## Official sources only

OpenClaw does not require any VS Code extensions, browser plugins, or external applications.

Install only from:

- https://openclaw.ai
- https://docs.openclaw.ai
- https://github.com/openclaw/openclaw

A fake extension called **"Claudebot Agent"** has been identified as a remote access trojan. Skills from Claw Hub have been found containing malware that steals API keys. Do not install anything from third-party forums or unverified videos.

---

## Hardware security

### Option A — Dedicated hardware (recommended)

Run OpenClaw on a device used for nothing else:

- Mac Mini, Raspberry Pi, or a used laptop ($40–$150)
- Wipe and reinstall the OS before first use
- No personal files or sensitive data on the device

**Benefits:**
- If compromised, only that device is affected
- Can be fully isolated on a separate network
- No risk to personal data or other devices

### Option B — Personal PC or laptop (higher risk)

OpenClaw runs with your user's permissions. If the bot is compromised, the attacker gets access to your documents, SSH keys, browser cookies, and anything else your user can reach.

**Mitigation steps if using a personal machine:**

1. Connect to a guest network (isolated from your main network)
2. Run OpenClaw inside Docker
3. When you need local resources (NAS, printer), stop Docker and switch networks
4. Switch back to the guest network to use OpenClaw

This trades convenience for containment.

---

## Network isolation

### Router configuration

Place the OpenClaw device on a **VLAN or guest network** that:

- Has no access to your main network devices (NAS, smart home, PCs)
- Blocks device-to-device communication within the guest network
- Allows only outbound connections to LLM APIs (Anthropic, OpenAI, Google, etc.)
- Blocks inbound connections to ports `18789` and `18790`

### Common router admin addresses

| Brand | Address |
|---|---|
| TP-Link | 192.168.1.100 or tplinkwifi.net |
| Netgear | 192.168.1.1 or routerlogin.net |
| ASUS | 192.168.1.1 or router.asus.com |
| Xfinity | 10.0.0.1 (check sticker) |

### Recommended Wi-Fi settings

- Change default router username and password
- Change Wi-Fi SSID and password from defaults
- Use **WPA3 Personal + WPA2 PSK AES**
- Guest network: disable local network access and inter-device communication

---

## Docker installation

There is no official Docker Hub image. Build from source:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
./docker-setup.sh
```

The setup script:

- Builds a local image called `openclaw_local`
- Creates data and workspace directories
- Walks through initial configuration

### Recommended setup choices during installation

| Prompt | Recommended choice |
|---|---|
| Security warnings | Accept (left arrow + Enter) |
| Onboarding mode | Quick start |
| Model provider | Open Router (free ZAI tokens, $0/month) |
| Channel setup | Skip for now |
| Install skills infrastructure | Yes (homebrew, npm) |
| npm vs root for skills | npm (avoids root access) |
| Install skills now | No — wait until sandbox is configured |

---

## Docker hardening

After initial setup, harden the `docker-compose.yml`:

### Port binding — localhost only

Change port bindings so the gateway does not listen on all interfaces:

```yaml
# WRONG — exposed on all interfaces
ports:
  - "18789:18789"

# CORRECT — localhost only
ports:
  - "127.0.0.1:18789:18789"
```

### Security flags

Add these to the gateway service in `docker-compose.yml`:

```yaml
services:
  openclaw_gateway:
    read_only: true
    tmpfs:
      - /tmp
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

**What each flag does:**

| Flag | Effect |
|---|---|
| `read_only: true` | Prevents malware from persisting to the filesystem |
| `tmpfs: /tmp` | Allows temporary operations without persistent writes |
| `no-new-privileges` | Prevents privilege escalation |
| `cap_drop: ALL` | Removes all Linux capabilities from the container |
| `docker.sock` volume | Required for sandbox container creation |

---

## Token synchronization

The master gateway token and the token in `openclaw.json` must match. Mismatches cause authorization errors.

```bash
# View current token
gp token.v

# Edit config
nano openclaw/openclaw.json
```

---

## Telegram channel setup

Telegram is the recommended channel because it uses outbound-only connections — no firewall port forwarding required.

### Create a bot

1. Open Telegram → search `@BotFather`
2. Send `/newbot`
3. Choose a name and username (must end in "bot")
4. Copy the HTTP API token

### Configure in OpenClaw

```bash
docker compose run -m openclaw-cli config set channels.telegram.enabled true
docker compose run -r openclaw-cli config set channels.telegram.bot_token YOUR_TOKEN
docker compose run -m openclaw-cli config set plugins.entries.telegram.enabled true
docker compose restart openclaw_gateway
docker compose down && docker compose up -d
```

### Verify channel status

```bash
docker compose exec openclaw_gateway node is_forward/index.js status -d
```

### Pair the bot

Start a chat with your bot in Telegram, then approve the pairing code:

```bash
docker compose exec openclaw_gateway node is/index.js pairing approve telegram YOUR_PAIRING_CODE
```

### Whitelist your Telegram ID

Prevents re-pairing and restricts who can use the bot:

```bash
docker compose run --rm openclaw-cli config set channels.telegram.allow_from '["YOUR_TELEGRAM_ID"]'
docker compose restart openclaw_gateway
docker compose down && docker compose up -d
```

---

## Sandbox configuration

The sandbox creates an isolated container for each tool execution. Malicious code running inside a sandboxed command cannot reach the main gateway container, cannot persist to disk, and has no network access.

### Setup

```bash
cd ~/openclaw
./scripts/sandbox-setup.sh
docker images | grep openclaw-sandbox
```

### Configure sandbox mode

```bash
docker compose run --rm openclaw-cli config set agent.defaults.sandbox.mode "non-main"
docker compose run -r openclaw-cli config set agents.defaults.sandbox.scope "agent"
docker compose run -r openclaw-cli config set agents.defaults.sandbox.docker.network "none"
docker compose run -m openclaw-cli config set agents.defaults.sandbox.docker.readonly_root "true"
docker compose run -r openclaw-cli config set agents.defaults.sandbox.docker.capdrop '["all"]'
```

### Configure allowed tools

```bash
# Allow basic file and execution tools
docker compose run -m openclaw-cli config set tools.sandbox.tools.allow '["exec", "read", "write", "edit", "apply_patch"]'

# Deny browser access inside sandbox
docker compose run --rm openclaw-cli config set tools.sandbox.tools.deny '["browser"]'
```

### Apply and verify

```bash
docker compose down && docker compose up -d

# Verify sandbox is active
docker compose exec openclaw_gateway node index.js sandbox explain
```

Sandbox inactive status before this step is expected.

---

## Verification commands

| Command | Purpose |
|---|---|
| `openclaw --version` | Check version — must be >= v2026129 |
| `docker ps` | Verify gateway listens on 127.0.0.1:18789 |
| `docker compose exec openclaw_gateway node index.js status` | Gateway status |
| `docker compose exec openclaw_gateway node index.js health` | Deep health check |
| `docker compose run --rm openclaw-cli security audit -d --deep` | Full security audit |
| `docker compose exec openclaw_gateway node index.js sandbox explain` | Sandbox status |

---

## Common Docker errors

| Error | Cause | Fix |
|---|---|---|
| Pull access denied | Image not built yet | Run `docker build -t openclaw_local .` in the project directory |
| Failed to read Dockerfile | Wrong directory | `cd ~/openclaw` first |
| Dial TCP lookup no such host | Docker lost internet | Restart Docker Desktop |

### Manual image build

```bash
cd ~/openclaw
docker build -t openclaw_local .
```

---

## Relevance to Exnoria

The following capabilities from this guide are directly relevant to the Exnoria cognitive layer design:

| Capability | Exnoria relevance |
|---|---|
| Gateway event loop | OpenClaw listens for events — aligns with Exnoria's event-driven cognitive layer requirement |
| Telegram + WhatsApp channels | Both are planned bidirectional interfaces for the Exnoria agent |
| Sandbox execution | Complements the Exnoria filter — two containment layers |
| Tool allowlist (`tools.sandbox.tools.allow`) | Maps directly to Exnoria's fixed toolset concept |
| Persistent context | Addresses Exnoria's persistent memory requirement |
| Docker isolation | Already used in the Exnoria stack — same network, same compose file |
| `no-new-privileges` + `cap_drop: ALL` | Should be applied to the `cognitive` service in Exnoria's `docker-compose.yml` |

### Key integration decision

OpenClaw's tool calls must exit through the Exnoria filter — not directly to external systems. This means:

- OpenClaw's tools are defined as filter API calls, not direct HubSpot/WhatsApp calls
- The sandbox contains OpenClaw's execution environment
- The filter enforces what actions are permitted
- Together: sandbox contains, filter permits, n8n executes

This preserves the Exnoria principle: **the cognitive layer decides, the orchestration layer executes.**

---

## Security checklist before deploying OpenClaw in Exnoria

- [ ] Version >= v2026129
- [ ] Gateway bound to `127.0.0.1` only, not `0.0.0.0`
- [ ] `read_only: true` on the cognitive container
- [ ] `cap_drop: ALL` and `no-new-privileges`
- [ ] Sandbox configured with `network: none`
- [ ] Tool allowlist restricted to filter API calls only
- [ ] Telegram ID whitelisted
- [ ] No skills installed from Claw Hub until Volume 210 is patched
- [ ] Token in `openclaw.json` matches gateway master token
- [ ] OpenClaw container on `Exnoria_internal` network — no external port exposure