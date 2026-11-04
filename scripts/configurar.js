import { copyFileSync, existsSync } from 'node:fs';
for (const directory of ['backend', 'frontend']) {
  const target = new URL(`../${directory}/.env`, import.meta.url);
  if (!existsSync(target)) copyFileSync(new URL(`../${directory}/.env.example`, import.meta.url), target);
}
console.log('Configuración lista. Inicie con npm run dev.');
