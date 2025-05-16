const passport = require("passport"); // passport 사용자인증
const local = require("./local"); // id와 passport를 사용하여 인증
const { User } = require("../models"); // users 테이블 - User 객체
const { where } = require("sequelize");

module.exports = () => {
  // 1. session 저장(Set) - 로그인한 사용자의 정보를 저장
  passport.serializeUser((user, done) => {
    done(null, user.id); // 세션에는 사용자 ID만 저장됨
  });

  // 2. session 조회(Get) - 세션에 저장된 사용자 ID를 기반으로 DB에서 사용자 조회
  passport.deserializeUser(async (id, done) => {
    // 비동기처리
    try {
      const user = await User.findOne({ where: { id } }); // ID로 사용자 조회
      done(null, user); // 조회된 정보 세션에 저장
    } catch (error) {
      // 에러출력
      console.error(error);
      done(error);
    }
  });

  // 3. ID, PASSPORT 인증
  local();
};
