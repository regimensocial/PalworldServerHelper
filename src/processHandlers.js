const { log } = require("./loggers");
const { bashProcess, setIsServerReady, getIsServerReady, runSaveCommandOnServer } = require("./server");

module.exports = () => {
	process.on("SIGINT", () => {
		log("SIGINT. Stopping the script...");

		if (bashProcess && getIsServerReady()) runSaveCommandOnServer();

		bashProcess && bashProcess.kill("SIGTERM");
    
		setIsServerReady(false);
		process.exit();
	});
    
	process.on("SIGTERM", () => {
		log("SIGTERM. Stopping the script...");

		if (bashProcess && getIsServerReady()) runSaveCommandOnServer();

		bashProcess && bashProcess.kill("SIGTERM");
		
		setIsServerReady(false);
		process.exit();
	});
    
	process.on("uncaughtException", () => {
		bashProcess && bashProcess.kill("SIGTERM");

		if (bashProcess && getIsServerReady()) runSaveCommandOnServer();
		
		setIsServerReady(false);
		process.exit();
	});

	process.stdin.resume();
};