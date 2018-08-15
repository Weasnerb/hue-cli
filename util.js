'use strict';

module.exports = function (program) {

  const chalk = require('chalk');
  const fs = require('fs');
  const path = require('path');

  const logPath = path.join(__dirname, '/hue.log');

  class util {
    /**
     * Display Error, Log err to file, and Exit
     * @param {string} messageToDisplay 
     * @param {object} [err]
     */
    errorMessage(messageToDisplay, err) {
      console.error(chalk.red(messageToDisplay));
      if (err && program.debug) {
        this._log(err);
      }
      process.exit(1);
    }

    /**
     * Log full error information to file
     * @param {object} err 
     */
    _log(err) {
      console.log('For more information see: ' + logPath);
      let dateTime = new Date();
      fs.appendFileSync(logPath, dateTime.toJSON() + '::' + err.stack + '\n');
    }

    /**
     * Display Success
     * @param {string} messageToDisplay 
     */
    successMessage(messageToDisplay) {
      console.log(chalk.green(messageToDisplay));
    }
  }

  return new util();
}
