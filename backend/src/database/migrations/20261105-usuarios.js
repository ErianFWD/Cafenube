import { DataTypes, Sequelize } from 'sequelize';
export const name = '20261105-usuarios';
export async function up(sequelize) {
  const query = sequelize.getQueryInterface();
  const tables = await query.showAllTables();
  if (!tables.includes('usuarios'))
    await query.createTable(
      'usuarios',
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        nombre: { type: DataTypes.STRING(100), allowNull: false },
        correo: { type: DataTypes.STRING(120), allowNull: false, unique: true },
        password: { type: DataTypes.STRING(60), allowNull: false },
        fecha_creacion: {
          type: DataTypes.DATE(3),
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)'),
        },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );
  const fields = await query.describeTable('usuarios');
  if (
    Object.keys(fields).sort().join(',') !== 'correo,fecha_creacion,id,nombre,password' ||
    fields.password.type !== 'VARCHAR(60)' ||
    fields.correo.allowNull ||
    !fields.id.primaryKey
  )
    throw new Error('La tabla usuarios existente no coincide; revise sin borrar datos.');
  const indexes = await query.showIndex('usuarios');
  if (
    !indexes.some(
      (index) =>
        index.unique && index.fields.length === 1 && index.fields[0].attribute === 'correo',
    )
  )
    throw new Error('usuarios.correo debe tener un índice único.');
}
export async function down() {
  throw new Error(
    'No se elimina usuarios automáticamente. Prepare un respaldo y una migración explícita si necesita retirar la autenticación.',
  );
}
