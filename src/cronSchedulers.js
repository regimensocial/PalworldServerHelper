const cron = require("node-cron");
const pidusage = require("pidusage");
const config = require("../config.json");
const { log, error } = require("./loggers");
const { bashProcess, runCommandOnServer, runSaveCommandOnServer, backupServer, runRestartOnServer } = require("./server");

module.exports = () => {

	// The server restarts every X hours (* */X * * *)
	// Because the developers mustn't have been aware memory leaks are a thing
	cron.schedule(`0 */${config.restartEveryXHours} * * *`, () => {
		log(`Performing regular ${config.restartEveryXHours} hour restart`);
		runCommandOnServer();
	});

	// The game saves every X minutes (*/X * * * *)
	// Because I don't trust the game to save itself
	cron.schedule(`*/${config.saveEveryXMinutes} * * * *`, () => {
		log(`Performing regular ${config.saveEveryXMinutes} minute save`);
		runSaveCommandOnServer();
	});

	// The game backs up every X hours (0 */X * * *)
	if (config.backupEveryXHours > 0) cron.schedule(`0 */${config.backupEveryXHours} * * *`, () => {
		log(`Performing regular ${config.backupEveryXHours} hour backup`);

		backupServer();

	});

	// Check memory usage every minute
	cron.schedule("* * * * *", () => {

		pidusage(bashProcess.pid, function (err, stats) {
			if (err) {
				error(err);
				return;
			}

			if (stats.memory > config.maxMemoryUsageInBytesBeforeRestart) {
				log("Memory usage is too high, restarting server");
				runRestartOnServer(true);
			}
		});
	});
};