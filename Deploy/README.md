# DatingEasy888 Arfa Deploy Folder

This folder is the deployment handoff area for the Arfa prototype.

## Deploy Target

- Provider: Render
- Runtime: Node.js
- Service type: Web service
- Entry point: `npm start`
- Health check: `/api/v1/health`

The root `render.yaml` is the deploy blueprint that Render should read from the
GitHub repository root.

## Deploy Package

The deploy archive is generated in this folder as:

```text
datingeasy888-arfa-0.4.0-deploy.tar.gz
```

The archive excludes local runtime files such as `node_modules`, SQLite build
databases, browser screenshots, `.git`, and private screen-copy references.

## Test Entrances After Deploy

Replace `<render-service-url>` with the Render service URL:

- Customer: `https://<render-service-url>/`
- Employee: `https://<render-service-url>/employee`
- Administrator: `https://<render-service-url>/admin`
- CEO: `https://<render-service-url>/ceo`

Prototype test accounts are documented in `PROTOTYPE.md`.

