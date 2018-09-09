'use strict';

module.exports = function (program) {

  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const hue = require('node-hue-api');

  const configPath = path.join(os.homedir(), '.hue');

  /**
   * Current Hue Config
   */
  class Config {
    constructor() {
      this._config = {};
      this._loadConfig();
    }

    /**
     * Set bridge
     */
    set bridge(bridge) {
      this._config.bridge = bridge;
      this._saveConfig();
    }

    get bridge() {
      return this._config.bridge;
    }

    set user(user) {
      this._config.user = user;
      this._saveConfig();
    }

    get user() {
      return this._config.user;
    }

    get api() {
      if (!this.bridge || !this.user) {
        return program.util.errorMessage('Please connect to a Hue bridge to run commands');

      }
      this._userExists();
      return new hue.api(this.bridge, this.user);
    }

    /**
     * Check if User Exists
     */
    _userExists() {
      new hue.api(this.bridge, this.user)
      .registeredUsers()
      .then(data => {
        let exists =  data.devices.filter(u => u.username === this.user).length == 1;
        if (!exists) {
          delete this._config.user
          this._saveConfig();

          let messages = ['User is no longer authenticated', 'Please run setup to re-authenticate']
          return program.util.errorMessage(messages);
        }
      })
      .fail(err => program.util.errorMessage('Unable to check if user exists', err));
    }

    /**
     * Load Config
     */
    _loadConfig() {
      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        this._config = config || {};
      } catch (e) {
        // Do nothing
      }
    }
    
    /**
     * Save the config
     */
    _saveConfig() {
      fs.writeFileSync(configPath, JSON.stringify(this._config))
    }

  }

  return new Config();
}
