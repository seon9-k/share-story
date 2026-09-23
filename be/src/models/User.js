const {Model, DataTypes} = require('sequelize');

class User extends Model {
  static initModel(sequelize) {
    return super.init(
      {
        user_id: {
          type: DataTypes.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        social_provider: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        social_id: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        email: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        genre_1: {
          type: DataTypes.ENUM('NOVEL', 'ECONOMY_BUSINESS', 'SELF_DEVELOPMENT',
                                'IT', 'ESSAY', 'TRAVEL_LIFESTYLE',
                                'PARENT_CHILD', 'HUMANITIES_PHILOSOPHY',
                                'SOCIETY', 'SCIENCE', 'HISTORY', 'ETC'),
          allowNull: true
        },
        genre_2: {
          type: DataTypes.ENUM('NOVEL', 'ECONOMY_BUSINESS', 'SELF_DEVELOPMENT',
                                'IT', 'ESSAY', 'TRAVEL_LIFESTYLE',
                                'PARENT_CHILD', 'HUMANITIES_PHILOSOPHY',
                                'SOCIETY', 'SCIENCE', 'HISTORY', 'ETC'),
          allowNull: true
        },
        monthly_reading_volume: {
          type: DataTypes.ENUM('BOOKS_1_2', 'BOOKS_3_4', 'BOOKS_5_6', 'BOOKS_7_PLUS'),
          allowNull: false
        },
        age_group: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        gender: {
          type: DataTypes.ENUM('M', 'F'),
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
        tableName: 'user',
        timestamps: true,
        paranoid: true, // deleted_at 소프트 삭제 지원
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
      }
    );
  }

  static associate(db){
      db.User.hasMany(db.Meetup, { foreignKey: 'leader_id', as: 'ledMeetups' });
      db.User.hasMany(db.Apply, { foreignKey: 'user_id', as: 'applies' });
  }

}

module.exports = User;