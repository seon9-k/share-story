const { Model, DataTypes } = require('sequelize');

class Apply extends Model {
  static init(sequelize) {
    return super.init(
      {
        apply_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        meetup_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        user_id: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('ING', 'COMPLETED'),
          allowNull: false
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
        tableName: 'apply',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        indexes: [
          { unique: true, fields: ['apply_id', 'meetup_id'] }, // 복합 FK 참조용
          { fields: ['user_id', 'created_at'] },
          {
            name: 'uq_apply_active',
            unique: true,
            fields: ['meetup_id', 'user_id'],
            where: { deleted_at: null }
          }
        ]
      }
    );
  }

  static associate(db) {
    db.Apply.belongsTo(db.User, { foreignKey: 'user_id'});
    db.Apply.belongsTo(db.Meetup, { foreignKey: 'meetup_id' });
    db.Apply.hasMany(db.Logbook, {foreignKey: 'apply_id',sourceKey: 'apply_id'});

    // Review와의 1:1 연관관계
    db.Apply.hasOne(db.Review, { foreignKey: 'apply_id' });

  }
}

module.exports = Apply;