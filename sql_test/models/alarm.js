module.exports = (sequelize, DataTypes) => {
  const Alarm = sequelize.define(
    "Alarm",
    {
      type: {
        type: DataTypes.ENUM("comment", "like", "follow"),
        allowNull: false,
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "alarms",
      timestamps: true,
      updatedAt: false,
      charset: "utf8mb4",
    }
  );
  Alarm.associate = (db) => {
    db.Alarm.belongsTo(db.User, { as: "recipient" });
    db.Alarm.belongsTo(db.User, { as: "sender" });
  };

  return Alarm;
};
