const { Model, DataTypes } = require('sequelize');

class Logbook extends Model {
  static init(sequelize) {
    return super.init(
      {
        logbook_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        meetup_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        session_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        apply_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        submitted_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        is_approved: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        created_user_id: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        updated_user_id: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        deleted_user_id: {
          type: DataTypes.STRING(100),
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'logbook',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        indexes: [
          { unique: true, fields: ['session_id', 'apply_id'] },
          { fields: ['session_id', 'is_approved'] }
        ]
      }
    );
  }

  static associate(db) {
    // 1. Session과의 외래키 연결 (session_id)
    db.Logbook.belongsTo(db.Session, { foreignKey: 'session_id',targetKey: 'session_id'});

    // 2. Apply와의 외래키 연결 (apply_id)
    db.Logbook.belongsTo(db.Apply, {foreignKey: 'apply_id',targetKey: 'apply_id'});

  }
}


module.exports = Logbook;