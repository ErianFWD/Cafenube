# Actualizar Café Nube al Día 2

Conserve una copia del proyecto y un respaldo de MySQL. Detenga los servidores con Ctrl+C, copie los archivos actualizados conservando sus .env y mantenga DB_NAME=cafenube. Desde la raíz ejecute:

```bash
npm install
npm run setup
npm run db:migrate
npm run dev
```

setup conserva la configuración existente y crea JWT_SECRET si falta. db:migrate añade usuarios y el registro de migraciones sin borrar datos. Abra el frontend, cree una cuenta e inicie sesión. No necesita recrear la base ni volver a importar SQL.

Para una instalación nueva use npm run db:setup en lugar de db:migrate. Consulte README.md para las instrucciones completas.
