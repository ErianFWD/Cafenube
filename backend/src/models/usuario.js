import { DataTypes } from 'sequelize';
export function defineUsuario(sequelize) {
  return sequelize.define(
    'usuarios',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      nombre: { type: DataTypes.STRING(100), allowNull: false, validate: { len: [2, 100] } },
      correo: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: { type: DataTypes.STRING(60), allowNull: false },
      fechaCreacion: {
        type: DataTypes.DATE(3),
        field: 'fecha_creacion',
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'usuarios',
      timestamps: false,
      defaultScope: { attributes: { exclude: ['password'] } },
      scopes: {
        conPassword: { attributes: ['id', 'nombre', 'correo', 'password', 'fechaCreacion'] },
      },
    },
  );
}
export function publicUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    correo: user.correo,
    fechaCreacion: new Date(user.fechaCreacion).toISOString(),
  };
}
