'use strict';

module.exports = function(program) {

  const diacritics = require('diacritics');
  const prompts = require('prompts');
  const Table = require('cli-table');

  /**
   * User table
   */
  const table = new Table({
    head: ['User Id', 'Name', 'Created', 'Last Accessed'],
  })

  /**
   * Get user by id
   * @param {string} userId 
   */
  function _getUser(userId) {
    return program.config.api
      .registeredUsers()
      .then(data => {
        return data.devices.filter(u => u.username === userId);
      })
      .fail(err => program.util.errorMessage('Unable to get user with id: ' + userId, err));
  }

  /**
   * Get users
   * @param {string?} name 
   */
  function _getUsers(name) {
    if (typeof name === 'string') {
      name = diacritics.remove(name).toLowerCase();
    }
    return program.config.api
      .registeredUsers()
      .then(data => {
        return data.devices.filter(u => {
          if (typeof name === 'string') {
            return diacritics.remove(u.name).toLowerCase().includes(name);
          } else {
            return true;
          }
        })
        .sort((a, b) => {
          // Sort by name alphabetically
          let nameA = a.name.toUpperCase();
          let nameB = b.name.toUpperCase();
          return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
        });
      })
      .fail(err => program.util.errorMessage('Unable to get users', err));
  }

  /**
   * Get Current User
   */
  function _getCurrentUser() {
    _getUser(program.config.user)
      .then(users => {
        for (let user of users) {
          table.push([user.username, user.name, user.created, user.accessed])
        }
        if (users.length > 0) {
          console.log(table.toString());
        } else {
          program.util.errorMessage('Could not get current user');
        }
      })
      .fail(err => program.util.errorMessage('Could not get current user', err))
  }

  /**
   * Print a list of all the users in a table
   * @param {string?} name 
   */
  function _listUsers(name) {
    _getUsers(name)
      .then(users => {
        for (let user of users) {
          table.push([user.username, user.name, user.created, user.accessed])
        }
        console.log(table.toString());
      })
      .fail(err => program.util.errorMessage('Could not get list of users', err))
  }

  /**
   * Deletes user with passed in User Id from bridge
   * @param {string} userId 
   */
  function _deleteUserById(userId) {
    return new Promise((resolve, reject) => {
      if (userId === program.config.user) {
        prompts({
          type: 'confirm',
          name: 'value',
          message: 'Do you want to delete current user?'
        })
        .then(data => {
          if (data.value) {
            program.config.api.deleteUser(userId)
              .then(() => {
                program.util.successMessage('Deleted user with id: ' + userId);
                resolve();
              })
              .fail(err => program.util.errorMessage('Unable to delete user with id: ' + userId, err))
          } else {
            resolve();
          }
        })
        .catch(err => program.util.errorMessage('Issue confirming deletion of self', err))
      } else {
        program.config.api.deleteUser(userId)
          .then(() => {
            program.util.successMessage('Deleted user with id: ' + userId);
            resolve();
          })
          .fail(err => program.util.errorMessage('Unable to delete user with id: ' + userId, err))
      }
    })
  }

  /**
   * Purge all users from bridge, optionally filtered by name
   * @param {string?} name 
   */
  function _purgeUsers(name) {
    _getUsers(name)
      .then(users => {
        let message = 'Are you sure you want to purge all users' + (typeof name === 'string' ? ' with name containing ' + name : '') + '?'
        prompts({
          type: 'confirm',
          name: 'value',
          message: message
        })
        .then(data => {
          if (data.value) {
            // When purging, if current user is to be deleted, always purge last and ask if sure they want to purge
            let currentUserToBeDeleted = false;
            let deletions = []
            for (let user of users) {
              if (user.username !== program.config.user) {
                deletions.push(_deleteUserById(user.username));
              } else {
                currentUserToBeDeleted = true;
              }
            }
            if (currentUserToBeDeleted) {
              Promise.all(deletions)
                .then(() => _deleteUserById(program.config.user))
                .catch(err => program.util.errorMessage('Error occured while purging users', err))
            }
          }
        })
        .catch(err => program.util.errorMessage('Issue confirming deletion of self', err))
      })
      .fail(err => program.util.errorMessage('Could not purge users from bridge', err))
  }

  /**
   * Setup Command
   */
  program
    .command('user')
    .alias('u')
    .description('Manage users on bridge')
    .option('-c, --current', 'Get current user')
    .option('-l, --list [name]', 'List registered users, using <name> as optional filter')
    .option('-d, --delete <id>', 'Delete registered user with <id> from bridge')
    .option('-p, --purge [name]', 'Delete all registered users, using <name> as optional filter')
    .action(function (command) { 
      if (command.current) {
        _getCurrentUser();
      } else if (command.list) {
        _listUsers(command.list);
      } else if (command.delete) {
        _deleteUserById(command.delete);
      } else if (command.purge) {
        _purgeUsers(command.purge);
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