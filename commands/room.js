'use strict';

module.exports = function(program) {
  
  const diacritics = require('diacritics');
  const Table = require('cli-table');

  /**
   * Room table
   */
  const roomTable = new Table({
    head: ['Id', 'Name', 'Lights in Room']
  });

  /**
   * Prints a list of Rooms filtered by name
   * @param {string?} name
   */
  function _printListOfRooms(name) {
    program.config.api.groups()
    .then(rooms => {
      rooms.forEach(room => {
        if (room.id != 0) {
          roomTable.push([room.id, room.name, room.lights]);
        }
      })
      console.log(roomTable.toString())
    })
    .fail(err => program.util.errorMessage('Error getting rooms', err));
  }

  /**
   * Create a scene with given name based on current light settings
   * @param {string} name
   * @param {number[]} lights
   */
  function _createRoom(name, lights) {
    if (!lights) {
      lights = []
    }
    if (!name || typeof name !== 'string') {
      program.util.errorMessage('No scene name specified');
    }
    program.config.api.createGroup(name, [])
    .then(results => program.util.successMessage('Created room successfully!'))
    .fail(err => program.util.errorMessage('Cannot create room with the name ' + name, err))
  }

	program
    .command('room')
    .alias('r')
    .description('Manage rooms')
    .option('-l, --list [name]', 'List rooms, using <name> as optional filter')
    .option('-c, --create [name]', 'Create room with <name>')
		.action(function(command) {
      if (command.list) {
        _printListOfRooms(command.list);
      } else if (command.create) {
        _createRoom(command.create, []);
      } else {
        if (command.help) {
          command.help();
        } else {
          let messages = ['Invalid usage of command', 'See --help for a list of available commands.'];
          program.util.errorMessage(messages);
        }
      }
		});

};