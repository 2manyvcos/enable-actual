# Enable Actual

**Import transactions from European banks into Actual Budget using Enable Banking.**

<div style="display: flex; flex-wrap: wrap; gap: .5em; margin: 1.6em 0 -.3em">
  <a href="https://hub.docker.com/r/2manyvcos/enable-actual" target="_blank">
    <img alt="Docker Image Version" src="https://img.shields.io/docker/v/2manyvcos/enable-actual?logo=docker&label=2manyvcos%2Fenable-actual" />
  </a>
  <a href="https://github.com/2manyvcos/enable-actual/blob/main/LICENSE" target="_blank">
    <img alt="License" src="https://img.shields.io/github/license/2manyvcos/enable-actual?color=%239944ee" />
  </a>
  <a href="https://github.com/2manyvcos/enable-actual" target="_blank">
    <img alt="Git Repository" src="https://img.shields.io/github/stars/2manyvcos/enable-actual?label=Source" />
  </a>
</div>

[Enable Banking](https://enablebanking.com) provides free (for personal use) access to bank transactions via official PSD2 APIs.  
Enable Actual connects this data to [Actual Budget](https://actualbudget.com) and keeps your transactions in sync automatically.

> ⚠️ **Security note:** Enable Actual has **read-only access** to your bank data. It cannot move or modify funds.

---

## Features

- Simple web UI for setup and import history
- Supports multiple bank accounts and Actual Budget accounts
- Automatic transaction import via PSD2 APIs
- Notifications via https://ntfy.sh (session expiry, errors)
- Easy deployment using the official Docker image

---

## Quick Start (Docker)

```bash
docker run \
  -it \
  -p 3000:3000 \
  -v ./data/sync:/data \
  -e PUBLIC_URL=https://sync.example.com \
  2manyvcos/enable-actual
```

Replace `https://sync.example.com` with your own URL.  
Then open the web UI and complete setup.

---

## Security & Requirements

- **HTTPS is required** for production use (PSD2 requirement)
- **No built-in authentication** — you must secure access yourself (e.g. reverse proxy with auth)

> ⚠️ If your instance is exposed to the internet without proper protection, your financial data may be accessible to others.

---

## Configuration

| Variable               | Description                                         | Default                         |
| ---------------------- | --------------------------------------------------- | ------------------------------- |
| `APP_NAME`             | Application name                                    | `Enable Actual`                 |
| `LISTEN_ADDRESS`       | IP address to bind to                               | `0.0.0.0`                       |
| `PORT`                 | HTTP port                                           | `3000`                          |
| `SSL_PRIVATE_KEY_FILE` | Path to SSL private key (enables HTTPS)             | —                               |
| `SSL_CERTIFICATE_FILE` | Path to SSL certificate (enables HTTPS)             | —                               |
| `PUBLIC_URL`           | Public URL (must match Enable Banking redirect URL) | `http://localhost:{PORT}`       |
| `DATA_DIR`             | Data directory                                      | `./data`                        |
| `HISTORY_LENGTH`       | Number of stored history entries                    | `10`                            |
| `ENABLEBANKING_API`    | Enable Banking API                                  | `https://api.enablebanking.com` |
| `LOG_LEVEL`            | Log level (`none`, `info`, `debug`)                 | `info`                          |

---

## Recommended Data Directory Permissions

```bash
sudo install -vd -o 1001 -g 1001 -m 750 ./data/sync
```

---

## Docker Compose (Traefik Example)

```yaml
networks:
  frontend:
    external: true
  backend:

services:
  actualbudget:
    image: actualbudget/actual-server
    restart: unless-stopped
    networks:
      - frontend
      - backend
    volumes:
      - ./data/actualbudget:/data
    environment:
      ACTUAL_USER_CREATION_MODE: login
    labels:
      - traefik.enable=true
      - traefik.docker.network=frontend
      - traefik.http.routers.actualbudget.rule=Host(`budget.example.com`)
      - traefik.http.routers.actualbudget.entrypoints=websecure
      - traefik.http.routers.actualbudget.middlewares=my-forward-auth-middleware
      - traefik.http.services.actualbudget.loadbalancer.server.port=5006

  sync:
    image: 2manyvcos/enable-actual
    restart: unless-stopped
    networks:
      - frontend
      - backend
    volumes:
      - ./data/sync:/data
    environment:
      PUBLIC_URL: https://sync.example.com
    labels:
      - traefik.enable=true
      - traefik.docker.network=frontend
      - traefik.http.routers.actualbudget-sync.rule=Host(`sync.example.com`)
      - traefik.http.routers.actualbudget-sync.entrypoints=websecure
      - traefik.http.routers.actualbudget-sync.middlewares=my-forward-auth-middleware
      - traefik.http.services.actualbudget-sync.loadbalancer.server.port=3000
```

Use `http://actualbudget:5006` as the Actual Budget server URL.

---

## Upgrading

### 2.0.0

Version 2.0.0 introduces a new **web-based configuration UI**.

- Automatic migration is **not supported**
- Start with a fresh data directory
- Reconfigure via the web interface

## Contributing

Contributions are welcome and appreciated!

This project is developed without the use of AI-generated code (aside from documentation assistance).
If you choose to contribute, please keep the following in mind:

- Aim for **clear, maintainable, and well-structured code**
- Keep pull requests **focused and reasonably scoped**
- Large or low-quality changes may be declined to preserve project maintainability

If you're unsure about a change, feel free to open an issue first to discuss it.
