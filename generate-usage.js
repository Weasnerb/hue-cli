'use strict'

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf')

const usageDocumentationDir = path.join(__dirname, '/documentation', '/usage');

class setUsage {

  constructor() {
    let baseProgramArgs = ['./index.js'];
    let root = this.getAllHelp(baseProgramArgs);

    this.generateAllUsageDocumentation(root);
  }

  /**
   * Get All Commander.js help in heirarchial json
   * @param {string[]} programArgs 
   * @param {string} [command]
   */
  getAllHelp(programArgs, command) {
    let root = {};
    if (command) {
      programArgs.push(command);
    }

    root.help = this.getHelp(programArgs);
    root.commands = {};
    let commands = this.getCommandsFromHelp(root.help);
    commands.forEach((command) => {
      root.commands[command] = this.getAllHelp(programArgs, command);
    });

    if (command) {
      programArgs.pop();
    }
    return root;
  }

  /**
   * Get the help of current command based on program args;
   * @param {string[]} programArgs 
   */
  getHelp(programArgs) {
    programArgs.push('-h');
    let process = childProcess.spawnSync('node', programArgs);
    programArgs.pop();
    if (process.stdout) {
      return process.stdout.toString();
    } else {
      return undefined;
    }
  }

  /**
   * Get all commands from help
   * @param {string} help 
   */
  getCommandsFromHelp(help) {
    let commands = [];
    if (typeof help === 'string') {
      let lines = help.split('\n');
      let commandFound = false;
      const commandRegEx = /^\s{4}([^| ]+)/
      lines.forEach((line) => {
        if (commandFound) {
          let command = commandRegEx.exec(line);
          if (command) {
            commands.push(command[1]);
          }
        }

        if (line.includes('  Commands:')) {
          commandFound = true;
        }
      })
    }

    return commands;
  }

  /**
   * Delete all Usage Documentation and recreate folder
   */
  cleanUsageDocumenation() {
    rimraf.sync(usageDocumentationDir);
    let documentationDir = path.join(__dirname, '/documentation');
    if (!fs.existsSync(documentationDir)) {
      fs.mkdirSync(documentationDir);
    }
    fs.mkdirSync(usageDocumentationDir);
  }

  /**
   * Generate the Usage documentation for entire program
   * @param {*} root 
   */
  generateAllUsageDocumentation(root) {
    this.cleanUsageDocumenation();

    if (root.commands) {
      this.generateUsageDocumentation(root, usageDocumentationDir);
    }

    if (root.help) {
      root.help = root.help.replace(/Usage: index/gm, 'Usage: hue')
      let markdownText = '```text' + root.help + '```';
      this.replaceInMarkdown(path.join(__dirname, '/README.md'), 'Usage', markdownText)
    }
  }

  /**
   * Helper function to generate Usage documentation
   * @param {*} root 
   * @param {*} dir 
   */
  generateUsageDocumentation(root, dir) {
    let commands = Object.keys(root.commands)
    commands.forEach((command) => {
      if (command.commands) {
        let subdir = path.join(dir, '/' + command);
        fs.mkdirSync(subdir);
        this.generateUsageDocumentation(command, subdir);
      }

      let prettyPrintCommand = command.substring(0, 1).toUpperCase() + command.substring(1);
      let markdown = '# ' + prettyPrintCommand + ' Command Usage\n\n```text' + root.commands[command].help + '```';

      let filePath = path.join(dir, command + '.md');
      try {
        fs.writeFileSync(filePath, markdown);
        console.log(prettyPrintCommand + ' Command Usage updated successfully!')
      } catch (error) {
        console.error('Error writing file: ', filePath, '\n', error);
      }

    })
  }

  /**
   * Replaces the text between "[//]: # (Start replaceTag)" tag and "[//]: # (End replaceTag)" tag
   * @param {string} replaceTag 
   * @param {string} text 
   */
  replaceInMarkdown(file, replaceTag, text) {
    let outputLines = [];
    let markdownText = fs.readFileSync(file).toString().replace(/\r\n/g, '\n');
    if (markdownText && typeof markdownText === 'string') {
      let lines = markdownText.split('\n');
      let replace = false;
      const startReplace = '[//]: # (Start ' + replaceTag;
      const endReplace = '[//]: # (End ' + replaceTag;
      lines.forEach((line) => {
        if (replace) {
          if (line.includes(endReplace)) {
            replace = false;
            outputLines.push('');
            outputLines.push(text);
            outputLines.push('');
            outputLines.push(line);
          }
        } else {
          if (line.includes(startReplace)) {
            replace = true;
          }
          outputLines.push(line);
        }
      })
    }
    try {
      fs.writeFileSync(file, outputLines.join('\n'));
      console.log(path.basename(file) + ' updated successfully!')
    } catch (error) {
      console.error('Error writing file: ' + path.basename(file), '\n', error);
    }
  }
}

new setUsage();