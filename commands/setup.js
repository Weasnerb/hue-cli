module.exports = function setupCommand(program) {
  'use strict';
  
  const config = require('../config');
  const hue = require('node-hue-api');
  const pkg = require('../package.json');

	program
		.command('setup')
    .description('Configure hue bridge or show current config')
    .option('-l, --list', 'List bridges on the network')
    .option('-i, --ip <ip>', 'Set bridge ip (use first bridge if not specified)')
    .option('--force', 'Force setup if already configured')
		.action(function(command) {
      if (command.list) {
        hue
          .nupnpSearch()
          .then(bridges => {
            bridges.forEach(b => console.log(b.ipaddress));
          }, () => console.error('No bridge found'));
      } else {
        if (config.bridge && config.user && !command.force) {
          console.log('Bridge already configured at ' + config.bridge);
        } else {
          hue
          .nupnpSearch()
          .then((bridges) => {
            let bridge = command.ip ? bridges.find(b => b.ipaddress === command.ip) : bridges[0];
            if (bridge) {
              config._config.bridge = bridge.ipaddress;
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
                  config._config.user = user;
                  config.saveConfig();
                  console.log('Linked bridge successfully');
              })
              .fail((err)=> console.error('Cannot link, press the button on bridge and try again.', err));
            }
          });
        }
      }
    });
};