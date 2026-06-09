const http = require('node:http');
const { createApplication } = require('./app');

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 4173);
const app = createApplication();
const server = http.createServer(app.handler);

server.listen(port, host, () => {
  console.log(`DatingEasy888 prototype listening on ${host}:${port}`);
  console.log(`This Mac:            http://127.0.0.1:${port}`);
  console.log('Other local devices: use this Mac\'s LAN IP with the same port');
});

function shutdown() {
  server.close(() => {
    app.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
