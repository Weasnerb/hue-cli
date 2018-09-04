'use strict';

module.exports = function (program) {

  const chalk = require('chalk');
  const fs = require('fs');
  const path = require('path');

  const logPath = path.join(__dirname, '/hue.log');

  class util {
    /**
     * Display Error, Log err to file, and Exit
     * @param {string|string[]} messageToDisplay 
     * @param {object} [err]
     * @param {boolean} [exit]
     */
    errorMessage(messageToDisplay, err, exit = true) {
      let messages = (!Array.isArray(messageToDisplay) ? [messageToDisplay] : messageToDisplay);
      
      if (err && program.debug) {
        messages.push('For more information see: ' + logPath)
        this._log(err);
      }
      
      // Commander.js error formatting (with coloring) if exit == true
      let spaces = '';
      if (exit) {
        spaces = '  ';
        console.error();
      }
      messages.forEach(function(message, index) {
        console.error(spaces + (index == 0 ? 'error: ': '') + chalk.red(message));
      })
      if (exit) {
        console.error();
        return process.exit(1);
      }
    }

    /**
     * Log full error information to file
     * @param {object} err 
     */
    _log(error) {
      if (error && program.debug) {
        let dateTime = new Date();
        fs.appendFileSync(logPath, dateTime.toJSON() + '::' + error.stack + '\n');
      }
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
