module.exports = function sceneCommand(program) {
  'use strict';
  
  const hue = require('node-hue-api');

	program
    .command('scene [name]')
    .alias('s')
    .description('Activate scene starting with <name>')
    .option('-l, --list', 'List scenes, using <name> as optional filter')
    .option('-m, --max <n>', 'Show at most <n> scenes when listing (10 by default)')
    .option('-c, --create', 'Create scene <name> using current lights state')
		.action(function(name, command) {

      console.log('name', name);
      console.log('list: ', command.list);
      console.log('max: ', command.max);
      console.log('create: ', command.create);

		});

};