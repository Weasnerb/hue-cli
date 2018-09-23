'use strict';

module.exports = function(program) {
  
  const Table = require('cli-table');
  
  /**
   * Bridge Table
   */
  const bridgeTable = new Table({
    head: ['Bridge Info', '']
  });

  /**
   * Presses the link button on currently configured bridge
   */
  function _pressButton() {
    program.config.api.pressLinkButton()
    .then(success => {
      program.util.successMessage('Link button pressed');
    })
    .fail(err => {
      program.util.errorMessage('Link button not pressed', err)
    })
  }

  /**
   * Get the current bridge's config
   */
  function _getCurrentBridgeConfig() {
    program.config.api.getConfig()
      .then(data => {
        let keys = Object.keys(data);
        keys.forEach(key => {
          let value = data[key];
          if (value && typeof value !== 'object' ) {
            bridgeTable.push([program.util.prettyPrint(key), value]);
          }
        })
        console.log(bridgeTable.toString());
      })
      .fail((err) => program.util.errorMessage('Could not get current bridge\'s config', err))
  }

  /**
   * Setup Command
   */
  program
    .command('bridge')
    .alias('b')
    .description('Manage current bridge')
    .option('-c, --current', 'Get current bridge config')
    .option('--press-button', 'Press the link button on currently configured bridge')
    .action(function (command) {
      if (command.current) {
        _getCurrentBridgeConfig();
      } else if (command.pressButton) {
        _pressButton();
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