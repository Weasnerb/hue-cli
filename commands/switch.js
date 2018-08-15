'use strict';

module.exports = function switchCommand(program) {

  const diacritics = require('diacritics');

  /**
   * Switches all lights either on or off
   * @param {boolean} on 
   */
  function switchAllLights(on = false) {
    program.config.api.setGroupLightState(0, { 'on': on });
    program.util.successMessage('All lights turned ' + ((on) ? 'on!' : 'off!'));
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
              .then(program.util.successMessage(lightGroup.name + ' was turned ' + ((on) ? 'on!' : 'off!')));
          } else {
            program.util.errorMessage('Room with name' + roomName + 'was not found')
          }
        })
      });
  }

  /**
   * On Command
   */
  program
    .command('on [room] [otherRooms...]')
    .description('Turn on all lights, or turn on lights in specific room(s)')
    .action(function (room, otherRooms) {
      if (room) {
        otherRooms.unshift(room);
        switchRoomLights(otherRooms, true);
      } else {
        switchAllLights(true);
      }
    })

  /**
   * Off Command
   */
  program
    .command('off [room] [otherRooms...]')
    .description('Turn off all lights, or turn off lights in specific room(s)')
    .action(function (room, otherRooms) {
      if (room) {
        otherRooms.unshift(room);
        switchRoomLights(otherRooms);
      } else {
        switchAllLights();
      }
    })

};