const { log } = require("./loggers");
const { bashProcess, setIsServerReady, getIsServerReady, closeServer } = require("./server");

module.exports = () => {
	process.on("SIGINT", () => {
		log("SIGINT. Stopping the script...");

		if (bashProcess && getIsServerReady()) closeServer();
		if (bashProcess && !getIsServerReady()) bashProcess.kill("SIGTERM");

		setIsServerReady(false);
		process.exit();
	});

	process.on("SIGTERM", () => {
		log("SIGTERM. Stopping the script...");

		if (bashProcess && getIsServerReady()) closeServer();
		if (bashProcess && !getIsServerReady()) bashProcess.kill("SIGTERM");

		setIsServerReady(false);
		process.exit();
	});

	process.on("SIGKILL", () => {
		log("SIGKILL. Stopping the script...");

		if (bashProcess) bashProcess.kill("SIGTERM");

		setIsServerReady(false);
		process.exit();
	});

	process.on("uncaughtException", () => {
		bashProcess && bashProcess.kill("SIGTERM");

		if (bashProcess && getIsServerReady()) closeServer();

		process.exit();
	});

	process.stdin.resume();
};