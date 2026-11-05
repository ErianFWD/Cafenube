import { randomBytes } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
for (const directory of ['backend', 'frontend']) {
  const target = new URL(`../${directory}/.env`, import.meta.url);
  if (!existsSync(target))
    copyFileSync(new URL(`../${directory}/.env.example`, import.meta.url), target);
}
console.log('Configuración lista. Inicie con npm run dev.');

const envFile = new URL('../backend/.env', import.meta.url);
let content = readFileSync(envFile, 'utf8');
if (!/^JWT_SECRET=.+$/m.test(content)) {
  content = content.replace(/^JWT_SECRET=.*$/m, '');
  writeFileSync(
    envFile,
    content.trimEnd() + '\nJWT_SECRET=' + randomBytes(48).toString('base64url') + '\n',
  );
}
console.log('La configuración conserva sus valores y genera JWT_SECRET solo si falta.');
