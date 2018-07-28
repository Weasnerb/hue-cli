const os = require('os');
const path = require('path');
const fs = require('fs');
const hue = require('node-hue-api');

const configPath = path.join(os.homedir(), '.hue');


class Config {
  constructor() {
    this._config = {};
    this._loadConfig();
  }

  set bridge(bridge) {
    this._config.bridge = bridge;
  }

  get bridge() {
    return this._config.bridge;
  }

  set user(user) {
    this._config.user = user;
  }

  get user() {
    return this._config.user;
  }

  get api() {
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
  
  saveConfig() {
    fs.writeFileSync(configPath, JSON.stringify(this._config))
  }

}

module.exports = new Config();
