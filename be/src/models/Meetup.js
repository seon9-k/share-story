const { Model, DataTypes } = require('sequelize');

class Meetup extends Model {
  static init(sequelize) {
    return super.init(
      {
        meetup_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        leader_id: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        title: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        book_title: {
          type: DataTypes.STRING(150),
          allowNull: false
        },
        book_image_url: {
          type: DataTypes.STRING(512),
          allowNull: true
        },
        price: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: { min: 0 }
        },
        min_capacity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: { min: 1 }
        },
        max_capacity: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        deadline: {
          type: DataTypes.DATE,
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM('RECRUITING', 'CLOSED', 'IN_PROGRESS', 'COMPLETED'),
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
        tableName: 'meetup',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        indexes: [
          { fields: ['leader_id'] },
          { fields: ['status', 'deadline'] }
        ]
      }
    );
  }

  static associate(db) {
    db.Meetup.belongsTo(db.User, { foreignKey: 'leader_id' });
    db.Meetup.hasMany(db.Session, { foreignKey: 'meetup_id' });
    db.Meetup.hasMany(db.Apply, { foreignKey: 'meetup_id' });
  }
}

module.exports = Meetup;