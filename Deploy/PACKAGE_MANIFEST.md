# Deploy Package Manifest

Package:

```text
Deploy/datingeasy-arfa-0.4.0-deploy.tar.gz
```

Included deployment files:

- `package.json`
- `package-lock.json`
- `render.yaml`
- `PROTOTYPE.md`
- `RELEASE_CHECKLIST.md`
- `RENDER_DEPLOYMENT.md`
- `Front/`
- `Back/`
- `Service/`
- `Database/`
- `Design/`
- `Test/`
- `Resource/`
- `Deploy/`

Excluded local files:

- `.git/`
- `node_modules/`
- `CodeSource/Build/*.sqlite`
- `CodeSource/Build/*.sqlite-*`
- `CodeSource/Test/*.png`
- `ScreenCopy/`
- `.DS_Store`

Verification commands:

```text
npm test
npm run test:browser
```
