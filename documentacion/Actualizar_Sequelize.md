# Café Nube con Sequelize

1. Detenga el proyecto con Ctrl+C y conserve una copia de su carpeta actual.
2. Extraiga el ZIP y copie los archivos actualizados sobre el proyecto. Conserve `backend/.env` y `frontend/.env`; el ZIP no contiene contraseñas.
3. En `backend/.env`, mantenga sus datos de conexión y `DB_NAME=cafenube`.
4. Desde la carpeta raíz del proyecto ejecute:

```bash
npm install
npm run dev
```

No vuelva a crear la base ni importe SQL: las tablas existentes son compatibles. Para una instalación nueva, ejecute primero `npm run setup`, configure `.env` y ejecute `npm run db:setup` antes de iniciar.

Los seis modelos y sus asociaciones están en `backend/src/models/entities.js`. La conexión Sequelize está en `backend/src/database/connection.js`. mysql2 permanece instalado porque es el driver que utiliza Sequelize para conectarse a MySQL.
