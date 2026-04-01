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
Enable Actual uses this service to automatically import your bank transactions into [Actual Budget](https://actualbudget.com).

> ⚠️ **Security note:** Enable Actual only has **read-only access** to your bank data. It cannot move or modify funds.

---

## Setup Guide

### 1. Configure Enable Banking

1. Visit [https://enablebanking.com](https://enablebanking.com) and create an account (if you don’t already have one).

2. Navigate to **API Applications** and click **Add a new application**.

3. Fill out the form:
   - **Environment:**
     - `Production` → real bank data
     - `Sandbox` → mock data for testing

   - Generate a **private key in the browser**

   - Use a descriptive name (e.g. `Actual Budget Import`)

   - **Redirect URL:**

     ```
     https://{your-enable-actual-hostname}:443/eb/callback
     ```

     - HTTPS is required for production
     - The URL does _not_ need to be publicly accessible

   - Provide your email (data protection contact)

   - Set Privacy Policy / Terms URL (e.g. your service URL)

4. Submit the form — a `.pem` private key file will be downloaded.

> 🔐 **Important:** Store the private key securely. You will need it later.

5. Save your **Application ID**
6. Link your bank accounts (required for the free plan)

After setup, your app will show as `restricted` but `active`, which is expected.

---

### 2. Configure Actual Budget

Enable Actual requires password authentication to connect to your Actual Budget server.

> ⚠️ **Important limitation:**
> You currently cannot configure both OpenID _and_ password authentication via environment variables or config files. Doing so will break API authentication.

#### Recommended setup

1. Start Actual Budget **without OpenID configuration**
2. Set a **server password**
3. Create your first budget
4. (Optional) Enable OpenID later via the UI:
   - Go to **Settings → OpenID**
   - Enable authentication

You may set `ACTUAL_USER_CREATION_MODE=login` to automatically create users after successful OpenID login.

#### Optional: Reverse proxy authentication (advanced)

For additional security, you can use something like Traefik ForwardAuth with the same OpenID provider:

- External access → protected via SSO
- Internal access → password authentication (for Enable Actual)

This setup:

- Disables password login for external users
- Keeps compatibility with the API client
- Enables multi-user setups securely

---

### 3. Configure Enable Actual

- **HTTPS is required** when using production banking data (PSD2 requirement)
- Run Enable Actual behind a reverse proxy with TLS
- **Add external authentication if exposed to the internet**

> ⚠️ Enable Actual does **not** provide built-in authentication.

---

## Configuration

| Variable                 | Description                                                                           | Default                         |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------- |
| `APP_NAME`               | Application name                                                                      | `Enable Actual`                 |
| `PORT`                   | HTTP port                                                                             | `3000`                          |
| `SYNC_SCHEDULE`          | Cron schedule for syncing                                                             | `0 0 * * *`                     |
| `SYNC_INITIAL_DAYS`      | Days to fetch on first sync                                                           | `30`                            |
| `SYNC_OVERSCAN_DAYS`     | Overlap days for syncing                                                              | `7`                             |
| `SESSION_EXPIRY_WARNING` | Notify before session expiry (ms)                                                     | `7 days`                        |
| `DATA_DIR`               | Data directory                                                                        | `./data`                        |
| `PUBLIC_URL`             | Public service URL (must match what is configured in your Enable Banking application) | `http://localhost:{PORT}`       |
| `NTFY_URL`               | ntfy.sh URL                                                                           | —                               |
| `NTFY_USERNAME`          | Optional username                                                                     | —                               |
| `NTFY_PASSWORD`          | Optional password                                                                     | —                               |
| `EB_API`                 | Enable Banking API URL                                                                | `https://api.enablebanking.com` |
| `EB_APP_ID`              | Enable Banking App ID                                                                 | —                               |
| `EB_PRIVATE_KEY`         | Private key                                                                           | —                               |
| `EB_PRIVATE_KEY_FILE`    | Path to private key file (alternative to `EB_PRIVATE_KEY`)                            | `./private.pem`                 |
| `EB_TOKEN_VALIDITY`      | Session validity (ms)                                                                 | `180 days`                      |
| `EB_BANK_NAME`           | Bank name (e.g. `N26`)                                                                | —                               |
| `EB_BANK_COUNTRY`        | Bank country (e.g. `DE`)                                                              | —                               |
| `EB_PSU_TYPE`            | PSU type                                                                              | `personal`                      |
| `ACTUAL_DATA_DIR`        | Actual data directory                                                                 | `{DATA_DIR}/actual`             |
| `ACTUAL_URL`             | Actual Budget URL                                                                     | —                               |
| `ACTUAL_PASSWORD`        | Server password                                                                       | —                               |
| `ACTUAL_BUDGET_ID`       | Budget sync ID                                                                        | —                               |
| `ACTUAL_BUDGET_PASSWORD` | Budget password                                                                       | —                               |
| `ACTUAL_ACCOUNT_ID`      | Target account ID                                                                     | —                               |

---

## Caveats

### Pending Transactions

- Only transactions with status `BOOK` are imported
- Previously imported transactions are skipped
- To avoid missing transactions that were pending earlier, Enable Actual overlaps sync ranges

Control this behavior with `SYNC_OVERSCAN_DAYS`.

---

### Foreign Currencies

- Transactions are imported **without currency conversion**
- The currency provided by Enable Banking is currently ignored
- Ensure your bank and Actual Budget use the same currency

---

## Notifications

Enable Actual supports push notifications via [ntfy.sh](https://ntfy.sh):

- Session expiry reminders
- Sync errors

To enable:

```bash
NTFY_URL=https://ntfy.sh/your-topic
```

---

## Docker

### Official Image

- [`2manyvcos/enable-actual`](https://hub.docker.com/r/2manyvcos/enable-actual)

### Configuration

```bash
docker run \
  -it \
  -p 3000:3000 \
  -v ./data/sync:data \
  -e PUBLIC_URL=https://sync.example.com \
  -e EB_APP_ID=${EB_APP_ID} \
  -e EB_BANK_NAME=N26 \
  -e EB_BANK_COUNTRY=DE \
  -e ACTUAL_URL=http://localhost:5006 \
  -e ACTUAL_PASSWORD=${ACTUAL_PASSWORD} \
  -e ACTUAL_BUDGET_ID=${ACTUAL_BUDGET_ID} \
  -e ACTUAL_ACCOUNT_ID=${ACTUAL_ACCOUNT_ID} \
  2manyvcos/enable-actual
```

Place your Enable Banking private key at:

```
./data/sync/private.pem
```

You can also use Docker secrets:

```bash
-e EB_PRIVATE_KEY_FILE=/run/secrets/private.pem
```

### File Permissions

Ensure the data directory is properly secured on the host:

```bash
sudo install -vd -o 1001 -g 1001 -m 750 ./data/sync
```

---

## Example: Docker Compose (with Traefik)

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
      EB_APP_ID: ${EB_APP_ID}
      EB_BANK_NAME: N26
      EB_BANK_COUNTRY: DE
      ACTUAL_URL: http://actualbudget:5006
      ACTUAL_PASSWORD: ${ACTUAL_PASSWORD}
      ACTUAL_BUDGET_ID: ${ACTUAL_BUDGET_ID}
      ACTUAL_ACCOUNT_ID: ${ACTUAL_ACCOUNT_ID}
    labels:
      - traefik.enable=true
      - traefik.docker.network=frontend
      - traefik.http.routers.actualbudget-sync.rule=Host(`sync.example.com`)
      - traefik.http.routers.actualbudget-sync.entrypoints=websecure
      - traefik.http.routers.actualbudget-sync.middlewares=my-forward-auth-middleware
      - traefik.http.services.actualbudget-sync.loadbalancer.server.port=3000
```

---

## Contributing

Contributions are welcome and appreciated!

This project is developed without the use of AI-generated code (aside from documentation assistance).
If you choose to contribute, please keep the following in mind:

- Aim for **clear, maintainable, and well-structured code**
- Keep pull requests **focused and reasonably scoped**
- Large or low-quality changes may be declined to preserve project maintainability

If you're unsure about a change, feel free to open an issue first to discuss it.
