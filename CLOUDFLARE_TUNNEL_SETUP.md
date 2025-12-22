# Cloudflare Named Tunnel Setup Guide

Complete guide to set up a **permanent Cloudflare tunnel** for SocialFlow media files.

> **Result**: A stable URL like `https://socialflow-media.yourdomain.com` that never changes, which you can start/stop anytime.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install cloudflared](#2-install-cloudflared)
3. [Create Named Tunnel](#3-create-named-tunnel)
4. [Configure the Tunnel](#4-configure-the-tunnel)
5. [Run the Tunnel](#5-run-the-tunnel)
6. [Connect to SocialFlow](#6-connect-to-socialflow)
7. [Auto-Start on Boot](#7-auto-start-on-boot)
8. [Quick Reference](#8-quick-reference)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

- **Cloudflare Account** - Free at [cloudflare.com](https://cloudflare.com)
- **Domain on Cloudflare** (optional) - Or use free `*.cfargotunnel.com` subdomain
- **SocialFlow running** - Docker containers up and accessible

---

## 2. Install cloudflared

### Windows (PowerShell as Admin)

```powershell
# Option 1: Using winget
winget install Cloudflare.cloudflared

# Option 2: Using Chocolatey
choco install cloudflared

# Option 3: Download directly
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

Verify installation:
```powershell
cloudflared --version
```

### Mac

```bash
# Using Homebrew
brew install cloudflared

# Verify
cloudflared --version
```

---

## 3. Create Named Tunnel

### Step 3.1: Login to Cloudflare

```bash
cloudflared tunnel login
```

This opens your browser. Select your Cloudflare account and authorize.

> **Note**: A certificate is saved to `~/.cloudflared/cert.pem`

### Step 3.2: Create the Tunnel

```bash
cloudflared tunnel create socialflow
```

**Save the output!** You'll see:
```
Created tunnel socialflow with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

This creates a credentials file at:
- **Windows**: `C:\Users\YOUR_USER\.cloudflared\xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json`
- **Mac**: `~/.cloudflared/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json`

### Step 3.3: Create DNS Route

**Option A: With your own domain** (recommended)
```bash
cloudflared tunnel route dns socialflow media.yourdomain.com
```

**Option B: Without a domain** (free Cloudflare subdomain)
```bash
# Your tunnel will be accessible at:
# https://socialflow-TUNNEL_ID.cfargotunnel.com
# (Cloudflare assigns this automatically)
```

---

## 4. Configure the Tunnel

### Windows

Create config file at `C:\Users\YOUR_USER\.cloudflared\config.yml`:

```powershell
# Create directory if needed
mkdir $env:USERPROFILE\.cloudflared -Force

# Create config file
notepad $env:USERPROFILE\.cloudflared\config.yml
```

### Mac

```bash
# Create directory if needed
mkdir -p ~/.cloudflared

# Create config file
nano ~/.cloudflared/config.yml
```

### Config File Content

Paste this (replace the placeholders):

```yaml
# Cloudflare Named Tunnel Configuration for SocialFlow
# =====================================================

tunnel: PASTE_YOUR_TUNNEL_ID_HERE
credentials-file: PASTE_CREDENTIALS_PATH_HERE

# Where to serve files from
ingress:
  # Route all traffic to your SocialFlow UI (which serves static files)
  - service: http://localhost:3000

  # Catch-all rule (required)
  - service: http_status:404
```

**Replace:**
- `PASTE_YOUR_TUNNEL_ID_HERE` - The UUID from step 3.2
- `PASTE_CREDENTIALS_PATH_HERE` - Full path to credentials JSON file

### Example Config (Windows)

```yaml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: C:\Users\John\.cloudflared\a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  - service: http://localhost:3000
  - service: http_status:404
```

### Example Config (Mac)

```yaml
tunnel: a1b2c3d4-e5f6-7890-abcd-ef1234567890
credentials-file: /Users/john/.cloudflared/a1b2c3d4-e5f6-7890-abcd-ef1234567890.json

ingress:
  - service: http://localhost:3000
  - service: http_status:404
```

---

## 5. Run the Tunnel

### Start Manually

```bash
cloudflared tunnel run socialflow
```

You should see:
```
INF Starting tunnel tunnelID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
INF Connection established connIndex=0 ...
```

**Your tunnel is now live!**

### Stop the Tunnel

Press `Ctrl+C` in the terminal.

### Verify It's Working

Open your browser and go to:
- **With domain**: `https://media.yourdomain.com`
- **Without domain**: `https://a1b2c3d4-e5f6-7890-abcd-ef1234567890.cfargotunnel.com`

You should see the SocialFlow UI.

---

## 6. Connect to SocialFlow

### Step 6.1: Get Your Tunnel URL

Your permanent tunnel URL is one of:
- `https://media.yourdomain.com` (if you set up DNS)
- `https://TUNNEL_ID.cfargotunnel.com` (free subdomain)

### Step 6.2: Update SocialFlow Settings

1. Open SocialFlow: `http://localhost:3000`
2. Go to **Settings** (gear icon in sidebar)
3. Find **Cloudflare Integration** section
4. Paste your tunnel URL
5. Click **Test Connection**
6. If successful, click **Save Settings**

### Step 6.3: Verify Media Access

Test that media files are accessible:

```bash
# Replace with your actual tunnel URL and a real file path
curl -I "https://media.yourdomain.com/your-client/batch/photo.jpg"
```

Should return `HTTP/2 200`.

---

## 7. Auto-Start on Boot

### Windows (Run as Service)

```powershell
# Install as Windows service (run PowerShell as Admin)
cloudflared service install

# Start the service
Start-Service cloudflared

# Check status
Get-Service cloudflared
```

To remove the service later:
```powershell
cloudflared service uninstall
```

### Mac (launchd)

```bash
# Install as launchd service
sudo cloudflared service install

# Start the service
sudo launchctl start com.cloudflare.cloudflared

# Check status
sudo launchctl list | grep cloudflared
```

To remove the service later:
```bash
sudo cloudflared service uninstall
```

### Alternative: Start with SocialFlow

Add to your start script or create a wrapper:

**Mac** - Edit `scripts/start-mac.sh` to add:
```bash
# Start Cloudflare tunnel in background
cloudflared tunnel run socialflow &
TUNNEL_PID=$!
echo "Cloudflare tunnel started (PID: $TUNNEL_PID)"
```

**Windows** - Create `start-with-tunnel.ps1`:
```powershell
# Start Cloudflare tunnel in background
Start-Process -NoNewWindow cloudflared -ArgumentList "tunnel", "run", "socialflow"

# Start SocialFlow
docker-compose up -d

Write-Host "SocialFlow and Cloudflare tunnel started!"
```

---

## 8. Quick Reference

### Commands Cheat Sheet

| Action | Command |
|--------|---------|
| Start tunnel | `cloudflared tunnel run socialflow` |
| Stop tunnel | `Ctrl+C` (or stop service) |
| Check tunnel status | `cloudflared tunnel info socialflow` |
| List all tunnels | `cloudflared tunnel list` |
| Delete tunnel | `cloudflared tunnel delete socialflow` |
| View logs | `cloudflared tunnel run socialflow --loglevel debug` |

### File Locations

| File | Windows | Mac |
|------|---------|-----|
| Config | `%USERPROFILE%\.cloudflared\config.yml` | `~/.cloudflared/config.yml` |
| Credentials | `%USERPROFILE%\.cloudflared\*.json` | `~/.cloudflared/*.json` |
| Certificate | `%USERPROFILE%\.cloudflared\cert.pem` | `~/.cloudflared/cert.pem` |

### Your Tunnel Info

After setup, fill in your details:

```
Tunnel Name: socialflow
Tunnel ID:   ________________________________
Tunnel URL:  ________________________________
```

---

## 9. Troubleshooting

### "tunnel not found"

```bash
# List your tunnels
cloudflared tunnel list

# Make sure config.yml has correct tunnel ID
```

### "failed to connect"

1. Check if SocialFlow is running:
   ```bash
   curl http://localhost:3000
   ```

2. Check config.yml points to correct port (3000)

### "certificate error"

```bash
# Re-login to Cloudflare
cloudflared tunnel login
```

### "permission denied" (Mac)

```bash
# Fix permissions
chmod 600 ~/.cloudflared/*.json
chmod 644 ~/.cloudflared/config.yml
```

### DNS not resolving

1. Check DNS route exists:
   ```bash
   cloudflared tunnel route dns socialflow media.yourdomain.com
   ```

2. Wait 2-5 minutes for DNS propagation

3. Verify in Cloudflare dashboard: DNS → CNAME record should exist

### View detailed logs

```bash
cloudflared tunnel run socialflow --loglevel debug
```

---

## Summary

After completing this guide, you have:

- [x] **Permanent URL** - Never changes, always the same
- [x] **Start/Stop Control** - Run tunnel only when needed
- [x] **Secure Connection** - HTTPS with Cloudflare SSL
- [x] **Works on Windows & Mac** - Same tunnel, any machine

**Workflow:**
1. Start SocialFlow: `make start`
2. Start tunnel: `cloudflared tunnel run socialflow`
3. Use the app - media URLs work through tunnel
4. Stop tunnel when done: `Ctrl+C`

---

## Need Help?

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [SocialFlow Issues](https://github.com/simobenziane/socialflow/issues)
