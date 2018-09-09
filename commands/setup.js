'use strict';

module.exports = function(program) {

  const hue = require('node-hue-api');
  const os = require('os');

  /**
   * List all Hue Bridges on Network
   */
  function _listBridges() {
    hue
      .nupnpSearch()
      .then(bridges => {
        bridges.forEach(b => console.log(((b.name) ? 'Name: ' +  b.name + ' at ip: ' : '') + b.ipaddress));
      })
      .fail((err) =>  program.util.errorMessage('Could not list bridges on network', err));
  }

  /**
   * Setup a Hue Bridge
   * @param {string} ip Setup specific bridge by ip
   * @param {boolean} force Force resetup
   */
  function _setupBridge(ip, force) {
    if (program.config.bridge && program.config.user && !force) {
      program.util.successMessage('Bridge already configured at ' + program.config.bridge);
      return;
    }

    hue
      .nupnpSearch()
      .then(bridges => {
        let bridge = ip ? bridges.find(b => b.ipaddress === ip) : bridges[0];
        if (bridge) {
          program.config.bridge = bridge.ipaddress;
          console.log('Hue bridge found at ' + program.config.bridge);
          return program.config.bridge;
        }
        return Promise.reject();
      })
      .catch(err => program.util.errorMessage('No bridge found', err))
      .then(bridge => {
        if (bridge) {
          new hue.api()
            .registerUser(bridge, 'hue-cli@' + os.hostname)
            .then(user => {
              program.config.user = user;
              program.util.successMessage('Linked bridge successfully');
            })
            .catch(err => program.util.errorMessage('Cannot link, press the button on bridge and try again.', err));
        }
      })
      .fail(err => program.util.errorMessage('Error linking to bridge', err));
  }

  /**
   * Setup Command
   */
  program
    .command('setup')
    .description('Setup a new hue bridge')
    .option('-l, --list', 'List bridges on the network')
    .option('-i, --ip <ip>', 'Set bridge ip (use first bridge if not specified)')
    .option('--force', 'Force setup if already configured')
    .action(function (command) {
      if (command.list) {
        _listBridges();
      } else {
        _setupBridge(command.ip, command.force);
      }
    });
};