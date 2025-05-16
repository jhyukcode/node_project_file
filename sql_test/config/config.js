const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  development: {
    username: "root",
    password: "1234",
    database: "node_react",
    host: "127.0.0.1",
    dialect: "mysql",
    timezone: "+09:00",
  },
  test: {
    username: "root",
    password: "1234",
    database: "node_react",
    host: "127.0.0.1",
    dialect: "mysql",
    timezone: "+09:00",
  },
  production: {
    username: "root",
    password: "1234",
    database: "node_react",
    host: "127.0.0.1",
    dialect: "mysql",
    timezone: "+09:00",
  },
};
