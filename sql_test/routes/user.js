const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const { User, Post } = require("../models");
const { isLoggedIn, isNotLoggedIn } = require("./login");
const { where } = require("sequelize");

// 1. 회원가입
router.post("/register", isNotLoggedIn, async (req, res, next) => {
  //res.send("회원가입");
  // 1-1. 이메일 중복 확인
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    // 1-2. 결과확인
    if (user) {
      return res.status(403).send("이미 사용중인 이메일입니다");
    }
    // 1-3. 비밀번호 암호화
    const hashPassword = await bcrypt.hash(req.body.password, 12);
    // 1-4. 사용자 생성
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashPassword,
    });
    // 1-5. 응답 : 회원가입 성공
    res.status(201).send("회원가입완료");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 2. 로그인 http://localhost:3065/user/login
router.post("/login", isNotLoggedIn, async (req, res, next) => {
  // res.send("..login");
  passport.authenticate("local", (err, user, info) => {
    // 1. 오류처리
    if (err) {
      console.error(err);
      return next(err);
    }
    // 2. 인증정보가 존재, 세션:401코드
    if (info) {
      return res.status(401).send(info.reason);
    }
    // 3. 사용자세션에 등록
    return req.login(user, async (loginErr) => {
      // 3-1. 로그인시 오류처리
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }
      // 3-2. 사용자 정보 조회
      const findUser = await User.findOne({
        where: { id: user.id }, // 아이디를 이용하여 정보 조회
        attributes: { exclude: ["password"] }, // 비밀번호 제외
        include: [
          { model: Post, attributes: ["id"] },
          {
            model: User,
            as: "Followers",
            attributes: ["id"], // 사용자가 팔로우한 다른 user의 id
          },
          { model: User, as: "Followings", attributes: ["id"] }, // 사용자를 팔로우한 다른 user의 id
        ],
      });
      return res.status(200).json(findUser);
    });
    // passport.authenticate() 의 반환값을 즉시 실행
  })(req, res, next);
});

// 3. 로그인 한 사용자의 정보 가져오기 GET : localhost:3065/user
router.get("/", isLoggedIn, async (req, res, next) => {
  // res.send("사용자 정보 조회");
  try {
    if (req.user) {
      const fullUser = await User.findOne({
        where: { id: req.user.id }, // 조건 : id로 검색
        attributes: { exclude: ["password"] }, // 비밀번호 빼고 결과 가져오기
        include: [
          { model: Post, attributes: ["id"] },
          {
            model: User,
            as: "Followings",
            attributes: ["id"],
          },
          {
            model: User,
            as: "Followers",
            attributes: ["id"],
          },
        ],
      });
      res.status(200).json(fullUser);
    } else {
      res.status(200).json(null); // 로그인 안되면 null 반환
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 4. 로그아웃 POST : localhost:3065/user/logout
router.post("/logout", isLoggedIn, (req, res, next) => {
  // res.send("로그아웃");
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/"); // 로그아웃 후 리다이렉션
  });
  req.session.destroy(); // 현재 세션 삭제
  res.send("로그아웃 성공!"); // 로그아웃이 되면 문자열 반환
});

// p. 이메일 변경 POST : localhost:3065/user/email
router.post("/email", isLoggedIn, async (req, res, next) => {
  // res.send("이메일 변경");
  try {
    await User.update(
      { email: req.body.email },
      { where: { id: req.user.id } }
    );
    res.status(200).json({});
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 5. 닉네임변경 POST : localhost:3065/user/nickname
// 5-1. 로그인
// 5-2. Header 쿠키설정
// 5-3. Body - [Raw] - [Json] { "nickname":"4444" }
router.post("/nickname", isLoggedIn, async (req, res, next) => {
  // res.send("닉네임 변경");
  try {
    await User.update(
      {
        nickname: req.body.nickname,
      },
      {
        where: { id: req.user.id },
      }
    );
    res.status(200).json({});
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 6. 팔로우 PATCH : localhost:3065/users/:userId/follow 팔로우 기능 추가
//                  localhost:3065/user/'ID'/follow (친구번호)
// 6-1. 위의 경로로 라우터 작성
// 6-2. 넘겨받은 아이디로 유저인지 확인(SELECT)
// 6-3. 유저에 추가
// 6-4. 상태표시
router.patch("/:userId/follow", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.userId },
    });
    if (!user) {
      return res.status(403).send("유저를 확인해주세요");
    }

    await user.addFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) }); // 10진수
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 7. 팔로잉 찾기 ( 내가 follow 한 친구) GET : localhostL3065/users/followings
// 7-1. 위의 경로로 라우터 작성
// 7-2. 넘겨받은 아이디로 유저 찾기
// 7-3. 해당 유저의 팔로잉 찾기 user.getFollowings()
router.get("/followings", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return res.status(403).send("존재하지 않는 사용자입니다");
    }
    const followings = await user.getFollowings();
    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 8. 팔로우찾기 ( 나를 follow 한 친구 ) GET : localhost:3065/user/followers
// 8-1. 위의 경로로 라우터 작성
// 8-2. 넘겨받은 아이디로 유저 찾기
// 8-3. 해당 유저의 팔로워 찾기 user.getFollowers()
router.get("/followers", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return res.status(403).send("존재하지 않는 사용자입니다");
    }
    const followings = await user.getFollowers();
    res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 9. 언팔로우 DELETE : localhost:3065/users/:userId/follow
//                      localhost:3065/user/'ID'/follow (친구번호)
// 9-1. 위의 경로로 라우터 작성
// 9-2. 언팔로우 할 친구 찾기
// 9-3. 팔로우 삭제 - removeFollowers
// 9-4. 상태표시
router.delete("/:userId/follow", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      return res.status(403).send("존재하지 않는 사용자입니다");
    }
    await user.removeFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 10. 나를 팔로우 한 사람 차단 DELETE : localhost:3065/follower/:userId
// 10-1. 위의 경로로 라우터 작성
// 10-2. 차단할 친구 찾기
// 10-3. 차단하기 - blockUser
// 10-4. 상태표시
router.delete("/follower/:userId", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return res.status(403).send("존재하지 않는 사용자입니다");
    }
    await user.removeFollowers(req.params.userId);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
