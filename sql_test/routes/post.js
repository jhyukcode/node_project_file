const express = require("express");
const router = express.Router();
const multer = require("multer"); //파일업로드
const path = require("path"); //경로
const fs = require("fs"); // file system 파일 쓰고 읽는
const { Post, User, Image, Comment, Hashtag } = require("../models");
const { isLoggedIn } = require("./login");

try {
  fs.accessSync("uploads"); // 폴더 존재여부 확인
} catch (error) {
  console.log("uploads 폴더가 없으면 생성합니다.");
  fs.mkdirSync("uploads");
}

router.post("/post", (req, res) => {
  res.send("글쓰기");
});
//1. 업로드 설정
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, "uploads"); // 저장 경로
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname); // 확장자 추출
      const basename = path.basename(file.originalname, ext); // 파일 이름만 추출
      done(null, basename + "_" + Date.now() + ext); // 예: image1_1715843892211.png
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
});

//2. 게시글 생성하고 관련데이터 저장하는 역할
// POST : localhost:3065/post   로그인을 했다면
// {"content" : "새 게시글 입니다. #노드 #리액트"}
//upload.none() :    form태그에서 fileupload 없을 때 처리

router.post("/", isLoggedIn, upload.none(), async (req, res, next) => {
  //res.send('..........post');
  try {
    const hashtags = req.body.content.match(/#[^\s#]+/g); //  /#[^\s#]+/g
    // 2. 게시글저장
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });
    // 3. 해시태그 존재 시 저장
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) =>
          Hashtag.findOrCreate({
            where: { name: tag.slice(1).toLowerCase() },
          })
        )
      );
      await post.addHashtags(result.map((v) => v[0])); // [node, true] , [react, true]
    }

    // 4. 이미지 처리
    if (req.body.image) {
      if (Array.isArray(req.body.image)) {
        const images = await Promise.all(
          req.body.image.map((image) => Image.create({ src: image }))
        );
        await post.addImages(images);
      } else {
        const image = await Image.create({ src: req.body.image });
        await post.addImages(image);
      }
    }

    // 5. 게시글 상세정보조회
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [
        { model: Image },
        { model: User, as: "Likers", attributes: ["id"] },
        { model: User, attributes: ["id", "nickname"] },
        {
          model: Comment,
          include: [{ model: User, attributes: ["id", "nickname"] }],
        },
      ],
    });
    res.status(200).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});
// 4. 이미지 업로드 POST localhost:3065/post/images
// 4-1. 로그인
// 4-2. 이미지 업로드 테스트
// HEADER : { content-type : multipart/form-data }
// BODY : form-data "image" : [파일1, 파일2, 파일3]}
router.post("/images", isLoggedIn, upload.array("image"), (req, res, next) => {
  console.log(req.files);
  res.json(req.files.map((v) => v.filename)); // 업로드된 파일이름
});
//create : 객체.create({})
//select : 객체.findAll, 객체.findOne
//update : 객체.update
//delete : 객체.destroy()

//3. 글삭제
// DELETE : localhost:3065/post/:postId  로그인을 했다면
router.delete("/:postId", isLoggedIn, async (req, res, next) => {
  //res.send('..........post 게시글삭제');
  try {
    await Post.destroy({
      where: {
        id: req.params.postId, //삭제하려는 게시글id
        UserId: req.user.id, //게시글작성자
      },
    }); // 삭제글 게시글 id와 게시글 작성자가 동일하면 삭제
    res.status(200).json({ PostId: parseInt(req.params.postId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//4. 좋아요 추가 PATCH : localhost:3065/post/:postId/like
// 4-1. 게시글 존재여부 확인
// 4-2. 좋아요 추가
// 4-3. 응답
router.patch("/:postId/like", isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });
    if (!post) {
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
    }
    await post.addLiker(req.user.id); // 좋아요 추가
    res.status(200).json({ PostId: post.id, UserId: req.user.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//5. 좋아요 삭제
router.delete("/:postId/like", isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });
    if (!post) {
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
    }
    await post.removeLiker(req.user.id); // 좋아요 삭제
    res.status(200).json({ PostId: post.id, UserId: req.user.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 6. 사용자 댓글 POST : localhost:3065/post/:postId/comment
// 6-1. 게시물 존재여부 확인
// 6-2. 댓글 작성
// 6-3. 댓글 조회
// 6-4. 응답
router.post("/:postId/comment", isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });
    if (!post) {
      return res.status(404).json({ message: "게시글이 존재하지 않습니다." });
    }
    const comment = await Comment.create({
      content: req.body.content,
      PostId: parseInt(req.params.postId, 10),
      UserId: req.user.id,
    });
    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [{ model: User, attributes: ["id", "nickname"] }],
    });
    res.status(201).json(fullComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});
//7. 리트윗
module.exports = router;
