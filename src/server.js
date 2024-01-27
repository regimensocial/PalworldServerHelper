const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const config = require("../config.json");
const { log, error } = require("./loggers");

let isServerReady = false;
let bashProcess;
let lastStartUpTime = 0;
let shouldLetServerClose = false;

function runCommandOnServer(command, successCallback, errorCallback) {

	if (!isServerReady) return;

	exec(`echo "${command}" | ${path.resolve(config.arrconLocation)} -H 127.0.0.1 -P ${config.rconPort} -p ${config.adminPassword}`, function (err, stdout) {
		// JavaScript is so awesome
		err && error(err);
		err && errorCallback && errorCallback();
		stdout && log(stdout);
		stdout && successCallback && successCallback();

		if (err) {
			error("Something went wrong with RCON", err);
		}

	});

}

function runSaveCommandOnServer() {
	runCommandOnServer("broadcast \"Saving...\"");

	runCommandOnServer("save", () => {
		runCommandOnServer("broadcast \"Saved!\"");
	});
}

function runRestartOnServer(manual = false) {
	runCommandOnServer("broadcast \"Saving...\"");

	runCommandOnServer("save", () => {

		// If it's been more than X minutes since the server started, we can assume it's safe to restart

		let timeSinceLastStartUp = (Date.now() - lastStartUpTime);
		if ((timeSinceLastStartUp > (1000 * 60 * config.saveEveryXMinutes)) || manual) {
			runCommandOnServer("broadcast \"Restarting...\"");
			runCommandOnServer("doExit");
		} else {
			log(`No need to restart, it's too soon (${timeSinceLastStartUp} ms since last start)`);
		}
	});
}

function startServer() {
	bashProcess = spawn(config.serverLocation, config.serverArguments.split(" "));
	lastStartUpTime = 0;
	log("Starting server... (PID " + bashProcess.pid + ")");

	bashProcess.stdout.on("data", (data) => {

		if (lastStartUpTime === 0) {
			lastStartUpTime = Date.now();
		}

		log(`Palworld Server: ${data}`);
	});

	bashProcess.stderr.on("data", (data) => {
		error(`Palworld Server ERR: ${data}`);

		if (lastStartUpTime === 0) {
			lastStartUpTime = Date.now();
		}

		// yep this is literally how we're checking if it's ready
		if (`${data}`.includes("SteamNetworkingUtils004")) {
			setTimeout(() => {
				isServerReady = true;
				log("Server is likely ready (or will be in a moment)!");

				setTimeout(() => {
					runCommandOnServer("broadcast \"Online\"");
				}, 2000);
			}, 10000);
		}
	});

	bashProcess.on("close", (code) => {
		log(`Palworld Server exited with code ${code}`);
		isServerReady = false;

		if (!shouldLetServerClose) {
			startServer();
		} else {
			log("Server closed successfully");
			process.exit();
		}
	});

	bashProcess.on("error", (err) => {
		error(`Palworld Server ERR: ${err.message}`);
	});
}

function backupServer() {
	if (!fs.existsSync(config.backupsLocation)) fs.mkdirSync(config.backupsLocation);

	const output = fs.createWriteStream(`${config.backupsLocation}/backup-${(new Date()).toISOString()}.zip`);

	const archive = archiver("zip", {
		zlib: { level: 9 }
	});

	archive.pipe(output);

	archive.directory(config.backupWhatLocation, false);

	archive.finalize();

	output.on("close", () => {
		log(`Backed up successfully: ${archive.pointer()} total bytes`);
	});

	archive.on("error", (err) => {
		throw err;
	});

	fs.readdir(config.backupsLocation, (err, files) => {
		if (err) {
			console.error(err);
			return;
		}

		if (files.length >= config.maxBackupsBeforeDeletingOld) {
			files.sort((a, b) => {
				const statA = fs.statSync(path.join(config.backupsLocation, a));
				const statB = fs.statSync(path.join(config.backupsLocation, b));
				return statA.mtime.getTime() - statB.mtime.getTime();
			});

			const oldestFile = path.join(config.backupsLocation, files[0]);
			fs.unlinkSync(oldestFile);

			console.log(`Deleted the oldest backup: ${oldestFile}`);
		}
	});
}

function closeServer() {
	shouldLetServerClose = true;

	runCommandOnServer("broadcast \"Saving...\"");

	runCommandOnServer("save", () => {
		runCommandOnServer("doExit");
	});
}

module.exports = {
	getIsServerReady: () => isServerReady,
	setIsServerReady: (value) => isServerReady = value,
	getIshouldLetServerClose: () => shouldLetServerClose,
	setShouldLetServerClose: (value) => shouldLetServerClose = value,
	bashProcess,
	startServer,
	runCommandOnServer,
	runSaveCommandOnServer,
	runRestartOnServer,
	backupServer,
	closeServer
};