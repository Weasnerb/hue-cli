module.exports = function sceneCommand(program) {
  'use strict';
  
  const hue = require('node-hue-api');


  function listScenes(name, max, print = false) {
    name = diacritics.remove(name).toLowerCase();
    return this.api
      .scenes()
      .then(scenes => {
        scenes = scenes
          .filter(s => diacritics.remove(s.name).toLowerCase().indexOf(name) >= 0)
          .sort((a, b) => {
            let diff = name ? (a.name.length - name.length) - (b.name.length - name.length) : 0;
            return diff ? diff : new Date(b.lastupdated).getTime() - new Date(a.lastupdated).getTime();
          })
          .slice(0, max);
        return print ?
          scenes.forEach(s => console.log(s.name.toLowerCase())) :
          scenes;
      });
  }

  function activateScene(name = '') {
    return this.listScenes(name, 1)
      .then(scenes => {
        if (scenes.length) {
          return this.api.activateScene(scenes[0].id);
        }
        this._exit(`No scene found with the name "${name}"`);
      });
  }

  function createScene(name) {
    if (!name) {
      this._exit('No scene name specified')
    }
    return this.api
      .getGroup(0)
      .then(group => this.api.createBasicScene(group.lights, name))
      .then(() => this._exit('Created scene successfully'), e => this._exit(`Cannot create scene: ${e}`));
  }

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