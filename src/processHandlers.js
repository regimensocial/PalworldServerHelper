const { log } = require("./loggers");
const { bashProcess, setIsServerReady } = require("./server");

module.exports = () => {
	process.on("SIGINT", () => {
		log("SIGINT. Stopping the script...");
		bashProcess && bashProcess.kill("SIGTERM");
    
		setIsServerReady(false);
		process.exit();
	});
    
	process.on("SIGTERM", () => {
		log("SIGTERM. Stopping the script...");
		bashProcess && bashProcess.kill("SIGTERM");
		
		setIsServerReady(false);
		process.exit();
	});
    
	process.on("uncaughtException", () => {
		bashProcess && bashProcess.kill("SIGTERM");
		
		setIsServerReady(false);
		process.exit();
	});

	process.stdin.resume();
};