const passport = require("passport");
const { Strategy: LocalStrategy } = require("passport-local"); // passport-local 인증전략 : LocalStrategy - 이메일, 비밀번호
const bcrypt = require("bcrypt"); // 암호화비교
const { User } = require("../models"); // User 객체 - users 테이블 가져오기
const { where } = require("sequelize");

module.exports = () => {
  passport.use(
    // step 1. email, password
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        // step 2
        // 2-1. 이메일을 이용하여 사용자 찾기
        // 2-2. 없을 경우 계정 정보가 일치하지 않습니다
        // 2-3. 있는 경우 비밀번호화 암호화된 비밀번호 비교하기 : 사용자 정보 저장 혹은 계정 정보가 일치하지 않습니다
        try {
          const user = await User.findOne({ where: { email } });
          if (!user) {
            return done(null, false, {
              reason: "입력하신 정보를 다시 확인해주세요",
            });
          }
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          }
          return done(null, false, {
            reason: "입력하신 정보를 다시 확인해주세요",
          });
        } catch (error) {
          console.error(error);
          return done(error);
        }
      }
    )
  );
};
