# Render Test Deployment

Status: Arfa local verification is green and `render.yaml` is committed.

## GitHub Checkpoint

Repository:

```text
git@github.com:wgong888/DatingEasy888.git
```

Branch:

```text
main
```

Use the latest pushed commit on `main` for the current deploy snapshot.

## Render Blueprint

The repository root contains `render.yaml`:

```yaml
services:
  - type: web
    name: datingeasy
    runtime: node
    plan: free
    buildCommand: npm ci --omit=dev
    startCommand: npm start
    healthCheckPath: /api/v1/health
    autoDeployTrigger: commit
    envVars:
      - key: NODE_ENV
        value: production
```

This follows Render's Blueprint model for a Node web service. Render sets the
`PORT` environment variable automatically, and `Service/server.js` uses it.

## Persistent Chat And History Data

Arfa stores chats, profiles, credits, robot/admin changes, and review data in
SQLite. The app now supports `DATINGEASY_DB_PATH` so the database can live on a
persistent Render disk instead of the temporary service filesystem.

Recommended Render data setting after attaching a persistent disk:

```text
DATINGEASY_DB_PATH=/var/data/datingeasy888.sqlite
```

Mount the Render disk at:

```text
/var/data
```

Important:

- Do not run `npm run reset` on Render.
- Production reset is blocked unless `ALLOW_PRODUCTION_DATABASE_RESET=true` is
  deliberately set.
- If no persistent disk is attached, Render filesystem data is still temporary
  and can disappear on redeploy, restart, or instance replacement.
- For Beta and production, move this data to SQL Server or another managed
  database service.

## Deploy Steps

1. Sign in to Render.
2. Connect the GitHub account that can access `wgong888/DatingEasy888`.
3. Choose `New` then `Blueprint`.
4. Select the `DatingEasy888` repository.
5. Confirm the root `render.yaml`.
6. Apply the Blueprint.
7. Wait for the `datingeasy` web service build and deploy to complete.
8. Open the service URL and verify:

```text
https://<render-service-url>/api/v1/health
```

Expected health response includes:

```json
{
  "status": "Healthy",
  "apiVersion": "v1",
  "prototypeVersion": "0.4.0",
  "releaseName": "Arfa"
}
```

## Test Entrances

After deployment, replace `<render-service-url>` with the Render URL:

- Customer: `https://<render-service-url>/`
- Employee: `https://<render-service-url>/employee`
- Administrator: `https://<render-service-url>/admin`
- CEO: `https://<render-service-url>/ceo`

Prototype accounts are listed in `PROTOTYPE.md`.

## Important Prototype Notes

- This is a test prototype, not production.
- The prototype uses SQLite. History is preserved across Render deploys only
  when `DATINGEASY_DB_PATH` points to an attached persistent disk.
- Payment, SMS/email, real-time delivery, production AI, media storage, SQL
  Server, and ASP.NET Core are still simulated or future Beta work.
