'use strict';

var program = require('commander');

// Set all commands
require('./commands')(program);

const pkg = require('./package.json');

program
  .version(pkg.version, '-v, --version')
  .description(pkg.description)
  .usage('<command> [options]');


program.on('command:*', function () {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });

program.parse(process.argv);

if (program.args.length == 0) {
  program.help();
}