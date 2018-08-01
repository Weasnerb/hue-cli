'use strict';

const program = require('commander');

// Set all commands
require('./commands')(program);

const pkg = require('./package.json');

program
  .version(pkg.version, '-v, --version')
  .description(pkg.description)
  .usage('<command> [options]');

program.config = require('./config');
program.util = require('./util');

program.on('command:*', function () {
    let message = 'Invalid command: ' + program.args.join(' ') + '\nSee --help for a list of available commands.';
    program.util.errorMessage(message)
  });

program.parse(process.argv);

if (program.args.length == 0) {
  program.help();
}