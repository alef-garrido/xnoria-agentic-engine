# Xnoria — Edge Device Deployment Guide

Target: Intel NUC, Beelink mini PC, Raspberry Pi 4/5. Tested on Ubuntu Server 24.04 LTS (x86-64) and Raspberry Pi OS Lite 64-bit (ARM64).

TLS is handled by Caddy with an internal (self-signed) CA — no public domain or internet access required.

---

## Prerequisites

| Requirement | Spec                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- |
| Device      | Intel NUC / Beelink / equivalent OR Raspberry Pi 4/5                                  |
| RAM         | 4GB minimum, 8GB recommended                                                          |
| Storage     | SSD strongly recommended (not SD card for 24/7 use — see note below)                  |
| OS          | Ubuntu Server 24.04 LTS (x86-64) or Raspberry Pi OS Lite 64-bit                       |
| Network     | Static IP or router-assigned DHCP reservation                                         |
| Internet    | Required for LLM API calls and Telegram — local network suffices for dashboard access |

### SD Card Warning (Raspberry Pi)

SD cards wear out quickly under database write loads. **Use an SSD via USB 3.0 or PCIe HAT for production deployments.** SD card is acceptable for evaluation only.

---

## 1. Hardware-Specific Notes

### Raspberry Pi 4/5 — Boot from SSD

```bash
# On a fresh Raspberry Pi OS install, update bootloader to prefer USB/PCIe
sudo raspi-config
# → Advanced Options → Boot Order → USB Boot
```

### Raspberry Pi — Thermal Management

Xnoria runs n8n, Postgres, and the cognitive layer continuously. Ensure adequate cooling:

- Pi 4: active cooler or quality heatsink required
- Pi 5: official active cooler recommended

Monitor temperature:

```bash
# Raspberry Pi only
vcgencmd measure_temp
```

---

## 2. OS and Docker Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker Engine
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# For Raspberry Pi OS, use the Debian repository instead:
# https://docs.docker.com/engine/install/debian/

sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
# Log out and back in to apply group membership
```

---

## 3. Local DNS Configuration

mDNS (`.local` hostnames) works out of the box on macOS and most Linux distros. For Linux, install `avahi-daemon`:

```bash
sudo apt install -y avahi-daemon
sudo systemctl enable --now avahi-daemon
```

### Set the device hostname

```bash
sudo hostnamectl set-hostname xnoria
```

After this, the device resolves as `xnoria.local` on the local network. You can connect from any machine with:

```bash
ping xnoria.local
```

**n8n** resolves at `xnoria-n8n.local` — you can configure a separate hostname alias or use the same hostname for both via Caddy.

### Alternative: Static IP + Router DNS

If mDNS is unreliable in your environment (e.g., Windows clients without Bonjour):

1. Assign a static IP in your router's DHCP settings for the device's MAC address
2. Configure your router's local DNS to resolve `xnoria.local` and `xnoria-n8n.local` to that static IP
3. All clients on the local network get name resolution without installing anything

---

## 4. Clone and Initialize

```bash
git clone https://github.com/your-org/xnoria.git
cd xnoria
chmod +x deploy/init.sh deploy/health-check.sh deploy/backup.sh deploy/restore.sh
./deploy/init.sh edge
```

When prompted for hostnames, use the defaults or your configured local DNS names:

- **n8n hostname:** `xnoria-n8n.local`
- **Dashboard hostname:** `xnoria.local`

---

## 5. Start with Edge Override

```bash
docker compose \
  -f docker-compose.yml \
  -f deploy/environments/edge/docker-compose.override.yml \
  up -d
```

Caddy will generate internal certificates automatically. There is no ACME challenge — certificates are signed by Caddy's own internal CA.

---

## 6. Trusting the Caddy Root CA

Because Caddy uses a self-signed internal CA, browsers will show a security warning on first visit. You must install the Caddy root CA certificate on each client device to eliminate the warning.

### Export the Caddy root certificate

```bash
docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > caddy-root.crt
```

### Install on macOS (client)

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain caddy-root.crt
```

### Install on Linux (client)

```bash
sudo cp caddy-root.crt /usr/local/share/ca-certificates/xnoria-caddy.crt
sudo update-ca-certificates
```

### Install on Windows (client)

1. Double-click `caddy-root.crt`
2. Click **Install Certificate → Local Machine → Trusted Root Certification Authorities**
3. Restart the browser

---

## 7. Accessing from Other Devices

From any device on the same local network:

| Service   | URL                      |
| --------- | ------------------------ |
| n8n       | https://xnoria-n8n.local |
| Dashboard | https://xnoria.local     |

If using static IP instead of mDNS:

| Service   | URL                              |
| --------- | -------------------------------- |
| n8n       | https://192.168.1.X (or your IP) |
| Dashboard | https://192.168.1.X:4000         |

---

## 8. Auto-Start on Boot

Docker is already configured to restart containers with `restart: always`. Docker itself starts on boot via systemd:

```bash
sudo systemctl enable docker
sudo systemctl is-enabled docker  # Should output: enabled
```

Verify the stack restarts after a reboot:

```bash
sudo reboot
# Wait 60 seconds after reboot
./deploy/health-check.sh
```

---

## 9. Performance Tuning

### Memory limits

Default limits in `deploy/environments/edge/docker-compose.override.yml` are set for 4GB RAM devices:

| Service   | Limit      |
| --------- | ---------- |
| postgres  | 512m       |
| n8n       | 512m       |
| cognitive | 256m       |
| dashboard | 256m       |
| filter    | 128m       |
| caddy     | 64m        |
| **Total** | **~1.8GB** |

For an 8GB device, increase `cognitive` and `n8n` limits:

```yaml
# In your local docker-compose.override.yml
cognitive:
  deploy:
    resources:
      limits:
        memory: 512m
n8n:
  deploy:
    resources:
      limits:
        memory: 1g
```

### Check memory usage

```bash
docker stats --no-stream
```

### Swap (recommended for Pi 4)

```bash
# Add 2GB swap
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

---

## 10. Backup on Edge

Schedule daily backups to a USB drive or network share:

```bash
# Mount USB drive
sudo mkdir -p /mnt/backup
sudo mount /dev/sdb1 /mnt/backup

# Cron: daily at 02:00
crontab -e
# Add:
# 0 2 * * * export BACKUP_PASSPHRASE=your-passphrase && /home/xnoria/xnoria/deploy/backup.sh /mnt/backup
```

---

## Troubleshooting

### mDNS not resolving

```bash
# Confirm avahi is running on the edge device
systemctl status avahi-daemon

# Confirm mDNS advertisement
avahi-browse -a
```

If avahi is running but `xnoria.local` doesn't resolve from a client, try flushing the mDNS cache on the client:

```bash
# macOS
sudo dscacheutil -flushcache

# Linux
sudo systemd-resolve --flush-caches
```

### Container OOM (Out of Memory)

If a container is killed by the OOM killer:

```bash
# Check for OOM events
dmesg | grep -i "killed process"
docker compose logs <service>
```

Increase the memory limit for the affected service in the override file and restart.

### Caddy certificate not trusted after CA install

Close all browser windows completely, reopen, and navigate to the service URL again. Some browsers cache certificate trust state until fully restarted.
