const { Model, DataTypes } = require('sequelize');

class Session extends Model {
  static init(sequelize) {
    return super.init(
      {
        session_id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        meetup_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        session_number: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        topic: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        sch_date: {
          type: DataTypes.STRING,
          allowNull: false
        },
        sch_day: {
          type: DataTypes.STRING(10),
          allowNull: false
        },
        sch_time: {
          type: DataTypes.STRING,
          allowNull: false
        },
        sch_st_time: {
          type: DataTypes.STRING,
          allowNull: false
        },
        sch_ed_time: {
          type: DataTypes.STRING,
          allowNull: false
        },
        zoom_url: {
          type: DataTypes.STRING(512),
          allowNull: true
        },
        zoom_password: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        status: {
          type: DataTypes.ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
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
        tableName: 'session',
        timestamps: true,
        paranoid: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        indexes: [
          { unique: true, fields: ['meetup_id', 'session_number'] },
          { unique: true, fields: ['session_id', 'meetup_id'] } // 복합 FK 참조용
        ]
      }
    );
  }

  static associate(db) {
    db.Session.belongsTo(db.Meetup, { foreignKey: 'meetup_id' });

    // Logbook과의 복합 외래키 연관관계 (session_id + meetup_id)
    db.Session.hasMany(db.Logbook, {
      foreignKey: ['session_id', 'meetup_id']
    });
  }
}

module.exports = Session;