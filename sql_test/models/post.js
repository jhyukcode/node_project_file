module.exports = ( sequelize, DataTypes ) => {
  const Post = sequelize.define('Post', {
    content: {
      type: DataTypes.TEXT,
      allowNull : false
    }
  }, {
    tableName : 'posts',
    timestamps : true,  // createdAt, updatedAt 생성
    charset : 'utf8mb4',
    collate : 'utf8mb4_general_ci' // 이모티콘
  });

  Post.associate = (db) => {
    db.Post.hasMany(db.Image);
    db.Post.hasMany(db.Comment);
    db.Post.belongsTo(db.User);
    db.Post.belongsTo(db.Post, { as: 'Retweet'});
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
    db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' });
   };

  return Post;
};