'use strict';

module.exports = function switchCommand(program) {

  const diacritics = require('diacritics');

  function _list(val) {
    let vals = val.split(',');
    vals.forEach(value => value = value.trim());
    return vals;
  }

  /**
   * Switches all lights either on or off
   * @param {boolean} on 
   */
  function _switchAllLights(on = false) {
    program.config.api.setGroupLightState(0, { 'on': on });
    program.util.successMessage('All lights turned ' + ((on) ? 'on!' : 'off!'));
  }

  /**
   * Switch individual lights by name
   * @param {string[]} lightNames 
   * @param {boolean} on 
   */
  function _switchLightsByNames(lightNames, on = false) {
  // Clean input 
  lightNames.forEach((lightName, index) => lightNames[index] = diacritics.remove(lightName).toLowerCase());
  program.config.api.lights()
    .then(data => {
      lightNames.forEach(lightName => {
        let light = data.lights.find(obj => diacritics.remove(obj.name).toLowerCase() == lightName);
        if (light) {
          program.config.api.setLightState(light.id, { 'on': on })
            .then(() => program.util.successMessage(light.name + ' was turned ' + ((on) ? 'on!' : 'off!')))
            .fail(err => program.util.errorMessage('Error turning ' + ((on) ? 'on' : 'off') + ' light with name: ' + light.name, err));
        } else {
          program.util.errorMessage('Light with name ' + lightName + ' was not found', null, (lightNames.length == 1));
        }
      })
    })
    .fail(err => program.util.errorMessage('Error turning ' + ((on) ? 'on' : 'off') + ' lights by name', err));
  }

  /**
   * Switch individual lights by id
   * @param {number[]} ids 
   * @param {boolean} on 
   */
  function switchLightsByIds(ids, on = false) {
    ids.forEach(lightId => {
      program.config.api.setLightState(lightId, { 'on': on })
            .then(() => program.util.successMessage('Light with id: ' + lightId + ' was turned ' + ((on) ? 'on!' : 'off!')))
            .fail(err => program.util.errorMessage('Error turning ' + ((on) ? 'on' : 'off') + ' light with id: ' + lightId, err, (ids.length == 1)));
    })
  }

  /**
   * Switches room(s) on or off
   * @param {string|string[]} rooms 
   * @param {boolean} on 
   */
  function switchRoomLights(rooms, on = false) {
    if (!Array.isArray(rooms)) {
      rooms = [rooms];
    }
    // Clean input 
    rooms.forEach((roomName, index) => rooms[index] = diacritics.remove(roomName).toLowerCase())
    program.config.api.groups()
      .then(group => {
        rooms.forEach(roomName => {
          let lightGroup = group.find(obj => {
            return diacritics.remove(obj.name).toLowerCase() == roomName;
          })
          if (lightGroup) {
            program.config.api.setGroupLightState(lightGroup.id, { 'on': on })
              .then(() => program.util.successMessage(lightGroup.name + ' was turned ' + ((on) ? 'on!' : 'off!')))
              .fail(err => program.util.errorMessage('Error turning ' + ((on) ? 'on' : 'off') + ' room with name: ' + lightGroup.name, err, false));
          } else {
            program.util.errorMessage('Room with name ' + roomName + ' was not found', null, false)
          }
        })
      })
      .fail(err => program.util.errorMessage('Error turning ' + ((on) ? 'on' : 'off') + ' room' + ((rooms.length > 1) ? 's' : ''), err));
  }

  /**
   * On Command
   */
  program
    .command('on [room] [otherRooms...]')
    .description('Turn on all lights, or turn on lights in specific room(s)')
    .option('-l, --light <lightNames>', 'Turn on individual lights by their name, in comma separated format', _list)
    .option('--light-id <lightIds>', 'Turn on individual lights by their id, in comma separated format', _list)
    .action(function (room, otherRooms, command) {
      if (command.light) {
        _switchLightsByNames(command.light, true);
      }

      if (command.lightId) {
        switchLightsByIds(command.lightId, true);
      }

      if (room) {
        otherRooms.unshift(room);
        switchRoomLights(otherRooms, true);
      }

      // If nothing passed in, turn on all lights
      if (!room && !command.light && !command.lightId) {
        _switchAllLights(true);
      }
    })

  /**
   * Off Command
   */
  program
    .command('off [room] [otherRooms...]')
    .description('Turn off all lights, or turn off lights in specific room(s)')
    .option('-l, --light <lightNames>', 'Turn off individual lights by their name, in comma separated format', _list)
    .option('--light-id <lightIds>', 'Turn off individual lights by their id, in comma separated format', _list)
    .action(function (room, otherRooms, command) {
      if (command.light) {
        _switchLightsByNames(command.light);
      }

      if (command.lightId) {
        switchLightsByIds(command.lightId);
      }

      if (room) {
        otherRooms.unshift(room);
        switchRoomLights(otherRooms);
      }

      // If nothing passed in, turn off all lights
      if (!room && !command.light && !command.lightId) {
        _switchAllLights();
      }
    })

};