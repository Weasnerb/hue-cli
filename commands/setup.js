'use strict';

module.exports = function setupCommand(program) {

  const hue = require('node-hue-api');
  const os = require('os');

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
      .then((bridges) => {
        let bridge = ip ? bridges.find(b => b.ipaddress === ip) : bridges[0];
        if (bridge) {
          program.config.bridge = bridge.ipaddress;
          console.log('Hue bridge found at ' + program.config.bridge);
          return program.config.bridge;
        }
        return Promise.reject();
      })
      .catch((err) => program.util.errorMessage('No bridge found'))
      .then(bridge => {
        if (bridge) {
          new hue.api()
            .registerUser(bridge, 'hue-cli@' + os.hostname)
            .then(user => {
              program.config.user = user;
              program.util.successMessage('Linked bridge successfully');
            })
            .catch((err) => program.util.errorMessage('Cannot link, press the button on bridge and try again.', err));
        }
      });
  }

  /**
   * List all Hue Bridges on Network
   */
  function _listBridges() {
    hue
      .nupnpSearch()
      .then(bridges => {
        bridges.forEach(b => console.log(b.ipaddress));
      })
      .fail(() => console.error('No bridge found'));

  }

  /**
   * Setup Command
   */
  program
    .command('setup')
    .description('Configure hue bridge or show current config')
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