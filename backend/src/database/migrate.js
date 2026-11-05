import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { DataTypes, Sequelize, QueryTypes } from 'sequelize';
import { databaseConfig, validateSchema } from './connection.js';
import * as usuarios from './migrations/20261105-usuarios.js';
export async function migrateDatabase(overrides = {}) {
  const config = databaseConfig(overrides);
  const sequelize = new Sequelize(config.database, config.user, config.password, {
    dialect: 'mysql',
    host: config.host,
    port: config.port,
    logging: false,
  });
  const connection = await sequelize.connectionManager.getConnection();
  const lock =
    'cafe_migrate_' + createHash('sha256').update(config.database).digest('hex').slice(0, 40);
  const query = (sql, replacements = []) =>
    sequelize.query(sql, { connection, replacements, type: QueryTypes.SELECT });
  let locked = false;
  try {
    const rows = await query('select get_lock(?,10) as acquired', [lock]);
    if (Number(rows[0].acquired) !== 1)
      throw new Error('Otra migración está en curso; intente de nuevo.');
    locked = true;
    await validateSchema({ all: (sql, ...args) => query(sql, args) }, { allowLegacy: true });
    const qi = sequelize.getQueryInterface();
    await usuarios.up(sequelize);
    const tables = await qi.showAllTables();
    if (!tables.includes('SequelizeMeta'))
      await qi.createTable(
        'SequelizeMeta',
        { name: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true } },
        { engine: 'InnoDB' },
      );
    await sequelize.query('insert ignore into `SequelizeMeta` (name) values (?)', {
      replacements: [usuarios.name],
    });
  } finally {
    if (locked) await query('select release_lock(?)', [lock]);
    await sequelize.connectionManager.releaseConnection(connection);
    await sequelize.close();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await migrateDatabase();
  console.log('Migración completada. Se conservaron los datos existentes.');
}
