const processHandlers = require("./src/processHandlers.js");
const webServer = require("./src/webServer");
const { startServer } = require("./src/server");
const cronSchedulers = require("./src/cronSchedulers.js");

startServer();
cronSchedulers();
webServer();
processHandlers();
