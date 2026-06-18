# Arfa Deploy Checklist

## Before Deploy

- Run `npm test`.
- Run `npm run test:browser`.
- Confirm `curl http://127.0.0.1:4173/api/v1/health` returns `Healthy`.
- Confirm no local-only files are included in the deploy package.
- Confirm the latest code is committed and pushed to GitHub.

## Render Deploy

1. Sign in to Render.
2. Connect GitHub repository `wgong888/DatingEasy888`.
3. Choose `New` then `Blueprint`.
4. Select the repository.
5. Confirm Render reads the root `render.yaml`.
6. Apply the blueprint.
7. Wait for build and deploy to finish.
8. Open `/api/v1/health` on the Render URL.

## Smoke Test After Deploy

- Customer login and discovery.
- Customer chat send and credit reduction.
- Customer add credits.
- Employee seed-chat workspace.
- Admin overview, robot search, robot edit, activate, deactivate.
- CEO dashboard and approval list.

## Prototype Limits

- SQLite is used for the Arfa prototype and should be treated as temporary on
  Render free hosting.
- Payment, SMS, email, outside AI, media storage, SQL Server, and C# Web API are
  still future Beta/production work.

