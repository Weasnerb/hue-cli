'use strict';

const program = require('commander');

// Program Info
const pkg = require('./package.json');

// Global Helpers
// Util must be first, because config uses it.
program.util = require('./util')(program);
program.config = require('./config')(program);

let commands = require('./commands');
// Load in all commands
commands.loadAllCommands(program)

// Set Top Level Options
program
  .option('--debug', 'output errors to log file')
  .version(pkg.version, '-v, --version')
  .description(pkg.description)
  .usage('<command> [options]');

// Unrecognized commands
program.on('command:*', function () {
    let messages = ['Invalid command: ' + program.args.join(' '), 'See --help for a list of available commands.'];
    program.util.errorMessage(messages);
  });

// Extra line on exit
process.on('exit', function(status) {
  if (status == 0) {
    console.log();
  }
})

program.parse(process.argv);

// Show help if no args
if (program.args.length == 0) {
  program.help();
}