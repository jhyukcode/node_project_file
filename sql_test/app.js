// 1. require
const express = require("express"); // express 프레임워크 사용하여 서버 생성
const cors = require("cors"); // cors origin 다른 도메인에서 api 요청 허용
const session = require("express-session"); // session
const cookie = require("cookie-parser"); // cookie

const passport = require("passport");
const passportConfig = require("./passport");
const path = require("path"); // 파일 업로드 시 경로 설정

const dotenv = require("dotenv"); // 환경변수 .env 로그
const morgan = require("morgan"); // 요청상태 모니터

const main = require("./routes/main");
const user = require("./routes/user");
const post = require("./routes/post");
const posts = require("./routes/posts");

// 2. 환경설정
dotenv.config(); // 환경설정 .env 로드
const app = express();

// 3. db 연동
const db = require("./models");
const cookieParser = require("cookie-parser");
const { FORCE } = require("sequelize/lib/index-hints");

db.sequelize
  .sync() // force : true - 테이블 강제 생성, false - 테이블이 없을 경우에만 생성
  .then(() => {
    console.log("✅ DB connected and models synced");
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
  });
passportConfig();

// 4. 각종 연동 > morgan / path / cors / session / cookieParser
app.use(morgan("dev")); // http 요청 로그 기록
app.use("/", express.static(path.join(__dirname, "uploads"))); // mac : /Users/, window : C:\
app.use(
  cors({
    origin: "http://localhost:3000", // 3000 react 요청 허용
    credentials: true, // 쿠키와 같은 인증정보를 포함한 요청도 허용
  })
);
app.use(express.json()); // 요청 본문파싱 > 클라이언트로부터 json 데이터 받을 때 사용
app.use(express.urlencoded({ extended: true })); // url 요청 파싱
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  session({
    saveUninitialized: false, // 초기화되지 않은 세션은 저장하지 않음
    resave: false, // 세션이 변경되지 않았다면 저장하지 않음
    secret: process.env.COOKIE_SECRET, // 세션데이터 암호화를 위한 비밀 키
  })
);
app.use(passport.initialize()); // 인증처리 라이브러리 초기화
app.use(passport.session()); // 사용자 인증상태를 세션에 저장

// 5. 라우팅
app.get("/", (req, res) => {
  res.send("hello express");
});
app.use("/main", main);
app.use("/user", user);
app.use("/post", post);
app.use("/posts", posts);

// 6. 서버설정 및 실행
app.listen(3065, () => {
  console.log("server run...");
});
