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
  class config {
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
      return new hue.api(this.bridge, this.user);
    }

    _loadConfig() {
      let config;
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        this._config = config || {};
      } catch (e) {
        // Do nothing
      }
    }
    
    _saveConfig() {
      fs.writeFileSync(configPath, JSON.stringify(this._config))
    }

  }

  return new config();
}
