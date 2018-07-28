module.exports = function setupCommand(program) {
  'use strict';
  
  const config = require('../config');
  const hue = require('node-hue-api');

  function setupBridge(ip, force) {
    if (config.bridge && config.user && !force) {
      console.log('Bridge already configured at ' + config.bridge);
    } else {
      hue
      .nupnpSearch()
      .then((bridges) => {
        let bridge = ip ? bridges.find(b => b.ipaddress === ip) : bridges[0];
        if (bridge) {
          config.bridge(bridge.ipaddress);
          config.saveConfig();
          console.log(`Hue bridge found at ${config.bridge}`);
          return config.bridge;
        }
        return Promise.reject();
      })
      .catch(() => console.error('No bridge found'))
      .then(bridge => {
        if (bridge) {
          new hue.api()
            .registerUser(bridge, 'hue cli utility')
            .then(user => {
              config.user(user);
              config.saveConfig();
              console.log('Linked bridge successfully');
          })
          .fail((err)=> console.error('Cannot link, press the button on bridge and try again.', err));
        }
      });
    }
  }

  function listBridges() {
    hue
      .nupnpSearch()
      .then(bridges => {
        bridges.forEach(b => console.log(b.ipaddress));
      })
      .fail(() => console.error('No bridge found'));

  }
  
	program
		.command('setup')
    .description('Configure hue bridge or show current config')
    .option('-l, --list', 'List bridges on the network')
    .option('-i, --ip <ip>', 'Set bridge ip (use first bridge if not specified)')
    .option('--force', 'Force setup if already configured')
		.action(function(command) {
      if (command.list) {
        listBridges();
      } else {
        setupBridge(command.ip, command.force);
      }
    });
};