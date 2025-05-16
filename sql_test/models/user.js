module.exports = (sequelize, DataTypes) => {
  /// const User
  const User = sequelize.define(
    "User",
    {
      //users테이블 - 자동으로 s 붙어서 생성
      email: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      nickname: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "users",
      timestamps: true, // createdAt, updatedAt 생성
      charset: "utf8",
      collate: "utf8_general_ci", // 한글저장
    }
  );

  User.associate = (db) => {
    db.User.hasMany(db.Post);
    db.User.hasMany(db.Comment);
    db.User.belongsToMany(db.Post, { through: "Like", as: "Liked" });
    db.User.belongsToMany(db.User, {
      through: "Follow",
      as: "Followers",
      foreignKey: "FollowingId",
    }); // user.getFollowers()
    db.User.belongsToMany(db.User, {
      through: "Follow",
      as: "Followings",
      foreignKey: "FollowerId",
    }); // user.getFollowings().
  };

  return User;
};
