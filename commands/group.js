'use strict';

module.exports = function (program) {

  const diacritics = require('diacritics');
  const Table = require('cli-table');
  const prompts = require('prompts');

  /**
   * Group table
   */
  const groupTable = new Table({
    head: ['Id', 'Name', 'Lights in Group']
  });

  /**
   * Prints a list of groups filtered by name
   * @param {string?} name
   */
  function _printListOfGroups(name = '') {
    if (name && typeof name === 'string') {
      name = diacritics.remove(name).toLowerCase();
    } else {
      name = '';
    }

    program.config.api.groups()
      .then(groups => {
        groups
        .filter(g => diacritics.remove(g.name).toLowerCase().includes(name))
        .forEach(group => {
          if (group.id != 0) {
            groupTable.push([group.id, group.name, group.lights]);
          }
        })
        console.log(groupTable.toString())
      })
      .fail(err => program.util.errorMessage('Error getting groups', err));
  }

  /**
   * Create a new Group with given name and selected Lights
   * @param {string} name
   */
  function _createGroup(name) {
    if (!name || typeof name !== 'string') {
      program.util.errorMessage('No group name specified');
    }
    program.config.api.lights().then(data => {
      let promptChoices = [];
      data.lights.forEach(light => {
        promptChoices.push({
          title: light.name,
          value: light.id
        });
      })
      prompts({
        type: 'multiselect',
        name: 'value',
        message: 'Pick lights to add to group',
        choices: promptChoices,
        hint: '- Space to select. Return to submit'
      }).then(data => {
        program.config.api.createGroup(name, data.value)
          .then(results => program.util.successMessage('Created group successfully!'))
          .catch(err => program.util.errorMessage('Cannot create group with the name ' + name, err))
      }).catch(err => program.util.errorMessage('Issue asking questions', err))
    }).fail(err => program.util.errorMessage('Unable to get lights', err));
  }

  /**
   * Able to delete group with passed in id
   * @param {number} id 
   */
  function _deleteGroupById(id) {
    program.config.api.groups().then(groups => {
      let deletingGroup = groups.find(g => g.id == id);
      if (deletingGroup) {
        prompts({
          type: 'confirm',
          name: 'value',
          message: 'Are you sure you want to delete ' + deletingGroup.name + '?'
        })
          .then(data => {
            if (data.value) {
              program.config.api.deleteGroup(id)
                .then(() => {
                  program.util.successMessage('Deleted group with id: ' + id);
                })
                .catch(err => program.util.errorMessage('Unable to delete group with id: ' + id, err))
            } else {
              program.util.errorMessage('Did not delete group with id: ' + id)
            }
          })
          .catch(err => program.util.errorMessage('Issue confirming deletion of group', err))
      } else {
        program.util.errorMessage('Group with id: ' + id + ' does not exist');
      }
    }).fail(err => program.util.errorMessage('Unable to get groups', err));
  }

  /**
   * Update name and/or lights of group with passed in id
   * @param {number} id 
   */
  function _updateGroupById(id) {
    program.config.api.groups().then(groups => {
      let updatingGroup = groups.find(g => g.id == id);
      if (updatingGroup) {
        program.config.api.lights().then(data => {
          let promptChoices = [];
          data.lights.forEach(light => {
            promptChoices.push({
              title: light.name,
              value: light.id,
              selected: updatingGroup.lights.includes(light.id)
            });
          })

          let questions = [{
            type: 'confirm',
            name: 'updateGroupName',
            message: 'Update group name?'
          },
          {
            type: prev => prev ? 'text' : null,
            name: 'newGroupName',
            message: 'New Group Name',
            initial: updatingGroup.name
          },
          {
            type: 'confirm',
            name: 'updateGroupLights',
            message: 'Update group lights?'
          },
          {
            type: prev => prev ? 'multiselect' : null,
            name: 'newGroupLights',
            message: 'Pick lights to have on group',
            choices: promptChoices,
            hint: '- Space to select. Return to submit'

          }];
          prompts(questions)
            .then(data => {
              let groupName = data.updateGroupName ? data.newGroupName : updatingGroup.name;
              let groupLights = data.updateGroupLights ? data.newGroupLights : updatingGroup.lights;
              program.config.api.updateGroup(id, groupName, groupLights).then(() => {
                program.util.successMessage('Group #' + id + ' has been updated');
              }).catch(err => {
                if (groupLights.length <= 0) {
                  program.util.errorMessage('Group must have at least one light', err)
                } else {
                  program.util.errorMessage('Unable to update group with id:' + id, err)
                }
              })
            })
            .catch(err => program.util.errorMessage('Issue asking questions', err))
        }).catch(err => program.util.errorMessage('Unable to get lights', err));
      } else {
        program.util.errorMessage('Group with id: ' + id + ' does not exist');
      }
    }).fail(err => program.util.errorMessage('Unable to get groups', err))
  }

  program
    .command('group')
    .alias('g')
    .description('Manage groups')
    .option('-l, --list [name]', 'List groups, using <name> as optional filter')
    .option('-c, --create <name>', 'Create group with <name>')
    .option('-u, --update <id>', 'Update group with <id>')
    .option('-d, --delete <id>', 'Delete group with <id>')
    .action(function (command) {
      if (command.list) {
        _printListOfGroups(command.list);
      } else if (command.create) {
        _createGroup(command.create);
      } else if (command.delete) {
        _deleteGroupById(command.delete);
      } else if (command.update) {
        _updateGroupById(command.update);
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