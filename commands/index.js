const fs = require('fs');
const path = require('path');

/**
 * Loads all commands within the commands folder
 * @param {*} program 
 */
module.exports = function commandLoader(program) {
	'use strict';

	let commands = {};
	const loadPath = path.dirname(__filename);

	// Loop though command files
	fs.readdirSync(loadPath).filter(function (filename) {
		return (/\.js$/.test(filename) && filename !== 'index.js');
	}).forEach(function (filename) {
		let name = filename.substr(0, filename.lastIndexOf('.'));

		// Require command
		let command = require(path.join(loadPath, filename));

		// Initialize command
		commands[name] = command(program);
	});

	return commands;
};