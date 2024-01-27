const express = require("express");
const fs = require("fs");
const config = require("../config.json");
const { runSaveCommandOnServer, runRestartOnServer, backupServer, runCommandOnServer, setShouldLetServerClose, getIsServerReady } = require("./server");
const { log } = require("./loggers");
const app = express();

module.exports = () => {
	const noKeyPage = fs.readFileSync("./pages/noKey.html", "utf8");
	const keyPage = fs.readFileSync("./pages/index.html", "utf8");

	app.use((req, res, next) => {
		if (req.query && req.query.key && req.query.key === config.serverPassword) {
			res.header("Access-Control-Allow-Origin", "*");
			return next();
		} else {
			res.status(401).send(noKeyPage);
		}
	});

	app.get(["/", "/index.html", "/index"], (req, res) => {
		res.send(keyPage);
	});

	// check if process is still running
	app.get("/status", (req, res) => {
		res.send(`${getIsServerReady()}`);
	});

	app.get("/save", (req, res) => {
		if (!getIsServerReady()) {
			return res.send("Server is not ready");
		}

		runSaveCommandOnServer();
		res.send("Saving...");

	});

	app.get("/restart", (req, res) => {
		if (!getIsServerReady()) {
			return res.send("Server is not ready");
		}

		runRestartOnServer(true);
		res.send("Restarting...");

	});

	app.get("/backup", (req, res) => {
		backupServer();

		res.send("Backing up...");

	});

	app.get("/close", (req, res) => {
		if (!getIsServerReady()) {
			return res.send("Server is not ready");
		}

		setShouldLetServerClose(true);

		runCommandOnServer("broadcast \"Saving...\"");

		runCommandOnServer("save", () => {
			runCommandOnServer("doExit");
		});

		res.send("Closing...");

	});

	app.listen(config.port, () => {
		log(`Listening on ${config.port}. Please make sure to use a web proxy with TLS!`);
	});
};