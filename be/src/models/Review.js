const { Model, DataTypes } = require('sequelize');

class Review extends Model {
  static init(sequelize) {
    return super.init(
      {
        review_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        apply_id: {
          type: DataTypes.BIGINT,
          unique: true,
          allowNull: false
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        rating: {
          type: DataTypes.SMALLINT,
          allowNull: true,
          validate: { min: 1, max: 5 }
        },
        reviewed_at: {
          type: DataTypes.DATE,
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
        tableName: 'review',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at'
      }
    );
  }

  static associate(db) {
    db.Review.belongsTo(db.Apply, { foreignKey: 'apply_id', as: 'apply' });
  }
}

module.exports = Review;