'use strict';

module.exports = function (program) {

  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const hue = require('node-hue-api');
  const pkg = require('./package.json');

  const configPath = path.join(os.homedir(), '.hue');

  /**
   * Current Hue Config
   */
  class Config {
    constructor() {
      this._config = {};
      this._loadConfig();
      // After loading the current config, see if we need to migrate it to newer versions
      if (!this._config.version || this._config.version !== pkg.version) {
        this._migrateConfig(this._config.version);
      }
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
          let exists = data.devices.filter(u => u.username === this.user).length == 1;
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


    /**
     * Migrate current config structure to new config structure
     */
    _migrateConfig() {
      // Make sure current config version exists, if not set to lowest version
      let currentConfigVersion = !this._config.version ? '0.0.0' : this._config.version;

      // Migration Dir
      const loadPath = path.join(path.dirname(__filename), 'migrations/config');

      if (fs.existsSync(loadPath)) {
        // Loop though migration files
        fs.readdirSync(loadPath)
          .filter((filename) => {
            // Only get files with proper naming and where semver of file is newer than current config's version
            return (/\d\.\d\.\d\.js$/.test(filename) && this._semVersionEquals(currentConfigVersion, this._getFilenameWithoutExtension(filename)) == -1);
          })
          .sort((filenameA, filenameB) => this._semVersionEquals(this._getFilenameWithoutExtension(filenameA), this._getFilenameWithoutExtension(filenameB)))
          .forEach((filename) => {
            require(path.join(loadPath, filename))(this._config);
          });
      }

      this._config.version = pkg.version;
      this._saveConfig();
    }

    /**
     * Get a semver from a se
     * @param {string} filename 
     */
    _getFilenameWithoutExtension(filename) {
      if (typeof filename !== 'string') {
        new Error('Filename is not a string');
      }
      return path.basename(filename, path.extname(filename));
    }

    /**
     * Check to see if a semver is greater than, equal to, or less than the other
     * @param {string} semVerOne 
     * @param {string} semVerTwo 
     */
    _semVersionEquals(semVerOne, semVerTwo) {
      if (typeof semVerOne !== 'string' || typeof semVerTwo !== 'string') {
        new Error('semvers must be strings')
      }
      let versionA = semVerOne.split('.');
      let versionB = semVerTwo.split('.');
      if (!(Array.isArray(versionA) && Array.isArray(versionB) && versionA.length === versionB.length)) {
        new Error('semvers must be properly formatted')
      }
      // npm Symantic Versioning only has 3 numbers
      for (let i = 0; i < 3; i++) {
        let order = versionA[i] - versionB[i]
        if (order !== 0) {
          return (order > 0 ? 1 : -1)
        }
      }
      return 0;
    }

  }

  return new Config();
}
