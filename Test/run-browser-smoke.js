const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { createApplication } = require('../Service/app');

async function main() {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'datingeasy-browser-'));
  const app = createApplication({
    databasePath: path.join(tempDirectory, 'browser.sqlite')
  });
  const server = http.createServer(app.handler);

  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const exitCode = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [path.join(__dirname, 'browser-smoke.js')],
        {
          cwd: path.resolve(__dirname, '..'),
          env: { ...process.env, PROTOTYPE_URL: origin },
          stdio: 'inherit'
        }
      );
      child.on('error', reject);
      child.on('exit', (code) => resolve(code ?? 1));
    });
    if (exitCode !== 0) process.exitCode = exitCode;
  } finally {
    await new Promise((resolve) => server.close(resolve));
    app.close();
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
