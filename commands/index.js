'use strict';

const fs = require('fs');
const path = require('path');

class CommandLoader {
		
	constructor() {}

	_loadCommandsInDir(loadPath, parentProgram) {
		let self = this;
		
		if (fs.existsSync(loadPath)) {
			// Loop though command files
			fs.readdirSync(loadPath).filter(function (filename) {
				return (/\.js$/.test(filename) && filename !== 'index.js');
			}).forEach(function (filename) {
				let name = filename.substr(0, filename.lastIndexOf('.'));
				
				// Load command into parentProgram
				require(path.join(loadPath, filename))(parentProgram);
				
				let loadedCommand = parentProgram.commands.find((cmd => cmd._name === name))
				
				let possibleSubCommandDir = path.join(loadPath, name);

				// Use self, because forEach overwrites 'this'
				if (loadedCommand) {
					self._loadCommandsInDir(possibleSubCommandDir, loadedCommand);
				}
			});
		}
	}

	loadAllCommands(program) {
		const loadPath = path.dirname(__filename);
		this._loadCommandsInDir(loadPath, program);
	}

}

module.exports = new CommandLoader();