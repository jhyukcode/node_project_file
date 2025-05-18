module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    "Report",
    {
      reported_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("post", "comment"),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.ENUM("pending", "resolved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      tableName: "reports",
      timestamps: true, // createdAt, updatedAt 생성
      updatedAt: false,
      charset: "utf8mb4",
    }
  );

  return Report;
};
