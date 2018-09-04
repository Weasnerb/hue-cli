'use strict';

module.exports = function sceneCommand(program) {
  
  const diacritics = require('diacritics');

  /**
   * Get Scenes filtered by name and limited by max
   * @param {string?} name 
   * @param {number?} max 
   */
  function _getScenes(name = '', max) {
    if (name) {
      name = diacritics.remove(name).toLowerCase();
    }
    return program.config.api
      .scenes()
      .then(scenes => {
        return scenes
          .filter(s => diacritics.remove(s.name).toLowerCase().indexOf(name) >= 0)
          .sort((a, b) => {
            let diff = name ? (a.name.length - name.length) - (b.name.length - name.length) : 0;
            return diff ? diff : new Date(b.lastupdated).getTime() - new Date(a.lastupdated).getTime();
          })
          .slice(0, max);
      });
  }

  /**
   * Prints a list of Scenes filtered by name and limited by max
   * @param {string?} name 
   * @param {number?} max 
   */
  function _printListOfScenes(name, max) {
    if (max == 0) {
      program.util.errorMessage('Max cannot be 0');
    }
    _getScenes(name, max)
      .then(scenes => {
        scenes.forEach(scene => console.log(scene.name));
      })
      .fail(err => program.util.errorMessage('No scenes found', err))
  }

  /**
   * Activate Scene with given name
   * @param {string?} name 
   */
  function _activateScene(name = '') {
    _getScenes(name, 1)
      .then(scenes => {
        if (scenes.length) {
          program.config.api.activateScene(scenes[0].id);
          program.util.successMessage(scenes[0].name + ' successfully activated!')
        } else {
          program.util.errorMessage('No scene found with the name ' + name);
        }
      });
  }

  /**
   * Create a scene with given name based on current light settings
   * @param {string?} name 
   */
  function _createScene(name) {
    if (!name) {
      program.util.errorMessage('No scene name specified');
    }
    program.config.api
      .getGroup(0)
      .then(group => program.config.api.createBasicScene(group.lights, name))
      .then(() => program.util.successMessage('Created scene successfully!'))
      .fail(err => program.util.errorMessage('Cannot create scene with the name ' + name, err));
  }

	program
    .command('scene [name]')
    .alias('s')
    .description('Activate scene starting with <name>')
    .option('-l, --list', 'List scenes, using <name> as optional filter')
    .option('-m, --max <n>', 'Show at most <n> scenes when listing (10 by default)')
    .option('-c, --create', 'Create scene <name> using current lights state')
		.action(function(name, command) {
      if (command.list) {
        _printListOfScenes(name, command.max);
      } else if (command.create) {
        _createScene(name);
      } else if (name) {
        _activateScene(name);
      } else {
        command.help();
      }
		});

};