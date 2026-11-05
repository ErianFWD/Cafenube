import { createApp } from './app.js';
const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT no es válido');
const { app, close } = await createApp();
const server = app.listen(port, '127.0.0.1', () =>
  console.log(`Café Nube disponible en http://localhost:${port}`),
);
server.on('error', () => {
  console.error('No se pudo abrir el puerto del backend.');
  close();
  process.exitCode = 1;
});
let closing = false;
function stop() {
  if (closing) return;
  closing = true;
  server.close(() => close());
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
