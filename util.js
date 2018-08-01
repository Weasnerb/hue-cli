const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '/hue.log');

/**
 * Display Error, Log err to file, and Exit
 * @param {string} messageToDisplay 
 * @param {object} [err]
 */
exports.errorMessage = function (messageToDisplay, err) {
  console.error(chalk.red(messageToDisplay));
  if (err) {
    _log(err);
  }
  process.exit(1);
}

function _log(err) {
  console.log('For more information see: ' + logPath);
  fs.appendFileSync(logPath, JSON.stringify(err) + '\n');
}

/**
 * Display Success
 * @param {string} messageToDisplay 
 */
exports.successMessage = function (messageToDisplay) {
  console.log(chalk.green(messageToDisplay));
}