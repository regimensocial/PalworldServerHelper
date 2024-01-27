const log = (message) => {
	console.log(`[${new Date().toISOString()}] ${message}`);
};

const error = (message) => {
	console.error(`[${new Date().toISOString()}] ${message}`);
};

module.exports = {
	log,
	error
};