# Xnoria — VPS Deployment Guide

Target: Ubuntu 24.04 LTS — tested on DigitalOcean, Hetzner, Vultr, and Linode.

HTTPS is handled by Caddy with automatic Let's Encrypt certificate provisioning.

---

## Prerequisites

| Requirement    | Spec                                              |
| -------------- | ------------------------------------------------- |
| VPS            | 2 vCPU, 2GB+ RAM, 20GB+ SSD — 4GB RAM recommended |
| OS             | Ubuntu 24.04 LTS (fresh install)                  |
| Domain         | A domain with DNS access                          |
| SSH access     | Root or sudo-capable user                         |
| Firewall ports | 22 (SSH), 80 (HTTP/ACME), 443 (HTTPS)             |

---

## 1. Server Preparation

SSH into your VPS:

```bash
ssh root@<your-vps-ip>
```

### Install Docker Engine

```bash
# Install dependencies
apt update && apt install -y ca-certificates curl gnupg

# Add Docker GPG key and repository
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Configure firewall

```bash
# Install and configure UFW
apt install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Caddy ACME challenge)
ufw allow 443/tcp   # HTTPS
ufw --force enable
ufw status
```

### Create a non-root deployment user

```bash
useradd -m -s /bin/bash xnoria
usermod -aG docker xnoria
mkdir -p /home/xnoria/.ssh
cp ~/.ssh/authorized_keys /home/xnoria/.ssh/
chown -R xnoria:xnoria /home/xnoria/.ssh
chmod 700 /home/xnoria/.ssh
chmod 600 /home/xnoria/.ssh/authorized_keys
```

Log out and reconnect as the `xnoria` user to verify SSH key access, then disable root password login:

```bash
# Edit /etc/ssh/sshd_config
PasswordAuthentication no
PermitRootLogin prohibit-password
# Then restart SSH
systemctl restart sshd
```

---

## 2. DNS Configuration

In your DNS provider, create two A records pointing to your VPS IP:

| Type | Name        | Value           | TTL |
| ---- | ----------- | --------------- | --- |
| A    | `n8n`       | `<your-vps-ip>` | 300 |
| A    | `dashboard` | `<your-vps-ip>` | 300 |

Example result:

- `n8n.yourdomain.com` → VPS IP
- `dashboard.yourdomain.com` → VPS IP

Wait for DNS propagation (1–5 minutes with TTL 300). Verify:

```bash
dig +short n8n.yourdomain.com
dig +short dashboard.yourdomain.com
```

Both must return your VPS IP before proceeding. Caddy will fail to obtain certificates if DNS is not resolving.

---

## 3. Clone and Initialize

SSH into the VPS as the `xnoria` user:

```bash
ssh xnoria@<your-vps-ip>
```

Clone the repository and initialize:

```bash
git clone https://github.com/your-org/xnoria.git
cd xnoria
chmod +x deploy/init.sh deploy/health-check.sh deploy/backup.sh deploy/restore.sh
./deploy/init.sh vps
```

When prompted, enter your actual domain names:

- **n8n hostname:** `n8n.yourdomain.com`
- **Dashboard hostname:** `dashboard.yourdomain.com`

---

## 4. Start with VPS Override

```bash
docker compose \
  -f docker-compose.yml \
  -f deploy/environments/vps/docker-compose.override.yml \
  up -d
```

This starts all services plus Caddy. Caddy will immediately begin the ACME challenge to provision certificates via Let's Encrypt. The first certificate provisioning takes 10–30 seconds.

Check Caddy logs:

```bash
docker compose logs -f caddy
```

Expected:

```
caddy  | {"level":"info","msg":"certificate obtained successfully","domains":["n8n.yourdomain.com"]}
caddy  | {"level":"info","msg":"certificate obtained successfully","domains":["dashboard.yourdomain.com"]}
```

---

## 5. Verify HTTPS

```bash
./deploy/health-check.sh
```

Manual verification:

```bash
# n8n reachable via HTTPS
curl -s -o /dev/null -w "%{http_code}" https://n8n.yourdomain.com/healthz

# Dashboard reachable via HTTPS
curl -s -o /dev/null -w "%{http_code}" https://dashboard.yourdomain.com/api/health
```

Both must return `200`.

---

## 6. Set Up Automated Backups

Create a cron job to back up daily at 03:00 UTC:

```bash
crontab -e
```

Add:

```cron
0 3 * * * export BACKUP_PASSPHRASE=your-passphrase && /home/xnoria/xnoria/deploy/backup.sh /home/xnoria/xnoria/backups >> /home/xnoria/xnoria/backups/backup.log 2>&1
```

Verify the cron job runs correctly:

```bash
./deploy/backup.sh
ls -lh backups/
```

---

## 7. Monitoring and Maintenance

### Check service status

```bash
docker compose ps
docker compose logs --tail=50 cognitive
docker compose logs --tail=50 filter
```

### Check recent filter_log entries

```bash
docker compose exec postgres psql -U xnoria -d exnoria -c \
  "SELECT action_id, status, created_at FROM filter_log ORDER BY created_at DESC LIMIT 20;"
```

### Rotate credentials

1. Update the value in `.env`
2. Restart the affected service:
   ```bash
   docker compose up -d <service-name>
   ```

---

## 8. Updating the Stack

```bash
cd /home/xnoria/xnoria
git pull
docker compose -f docker-compose.yml -f deploy/environments/vps/docker-compose.override.yml up -d --build
```

Apply any new migrations:

```bash
docker compose exec postgres psql -U xnoria -d exnoria < layers/orchestration/filter/db/migrations/NNN_new.sql
```

---

## Troubleshooting

### Caddy fails to obtain certificate

**Cause:** DNS not yet pointing to the VPS, or port 80 is blocked.

**Fix:**

1. Confirm `dig +short n8n.yourdomain.com` returns your VPS IP
2. Confirm UFW allows port 80: `ufw status`
3. Wait for DNS propagation, then restart Caddy: `docker compose restart caddy`

### n8n is unreachable via subdomain

**Cause:** n8n container is not healthy or Caddy upstream failed.

**Fix:**

1. `docker compose ps n8n` — must show `healthy` or `Up`
2. From inside the Caddy container: `docker compose exec caddy wget -qO- http://n8n:5678/healthz`
3. Ensure `n8n` and `caddy` are on the same `xnoria_internal` network
