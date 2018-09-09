'use strict'

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const urljoin = require('url-join');
const util = require('./util')(null);

const pkg = require('./package.json');

const usageDocumentationDir = path.join(__dirname, '/documentation', '/usage');

class SetUsage {

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
  getAllHelp(programArgs) {
    let root = {};

    root.help = this.getHelp(programArgs);
    root.commands = {};
    let commands = this.getCommandsFromHelp(root.help);
    commands.forEach((command) => {
      programArgs.push(command);
      root.commands[command] = this.getAllHelp(programArgs);
      programArgs.pop();
    });

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

    let readmePath = path.join(__dirname, '/README.md');

    if (root.commands) {
      let parentUsageMarkdown = '../../README.md';
      this.generateUsageDocumentation(root, usageDocumentationDir, parentUsageMarkdown);
      
      let relativeUsageDir = path.relative(__dirname, usageDocumentationDir);
      let githubDocLink = urljoin(pkg.homepage, '/blob/master/', relativeUsageDir)
      let subCommandUsageLinks = this.getCommandUsageLinks(root, githubDocLink, true);
      let subCommandMarkdownLinks = this.getCommandUsageMarkdownLinks(subCommandUsageLinks, 3)
      if (subCommandMarkdownLinks) {
        this.replaceInMarkdown(readmePath, 'SubCommandUsage', subCommandMarkdownLinks)
      }
    }

    if (root.help) {
      root.help = root.help.replace(/Usage: index/gm, 'Usage: hue')
      let markdownText = '```text' + root.help + '```';
      this.replaceInMarkdown(readmePath, 'Usage', markdownText)
    }
  }

  /**
   * Helper function to generate Usage documentation
   * @param {object} root
   * @param {path} dir Directory to save command usage in
   * @param {string} parentUsageMarkdownPath This is used to generate back button on child commands.
   */
  generateUsageDocumentation(root, dir, parentUsageMarkdownPath) {
    let commands = Object.keys(root.commands)
    commands.forEach((command) => {
      if (command.commands) {
        let subdir = path.join(dir, '/' + command);
        fs.mkdirSync(subdir);
        let subCommandParentMarkdownPath = path.join('../', command + '.md');
        this.generateUsageDocumentation(command, subdir, subCommandParentMarkdownPath);
      }
      
      let prettyPrintCommand = util.prettyPrint(command)
      let markdown = '# ' + prettyPrintCommand + ' Command Usage\n\n'
      markdown += '[<- Back](' + parentUsageMarkdownPath + ')\n\n';
      markdown += '```text' + root.commands[command].help + '```';
      
      let subCommandUsageLinks = this.getCommandUsageLinks(command);
      if (subCommandUsageLinks && subCommandUsageLinks.length != 0) {
        markdown += '\n'
        markdown += this.getCommandUsageMarkdownLinks(subCommandUsageLinks, 2);
      }

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
   * Get the links to each sub command's usage markdown file
   * @param {object} command 
   * @param {string} [defaultDir]
   * @param {boolean} [defaultDirIsUrl]
   */
  getCommandUsageLinks(command, defaultDir, defaultDirIsUrl) {
    let links = [];
    if (command.commands) {
      let commands = Object.keys(command.commands)
      commands.forEach(subCommand => {
        let link = {};
        link['name'] = util.prettyPrint(subCommand);
        if (defaultDir && !defaultDirIsUrl) {
          link['link'] = path.join(defaultDir, subCommand + '.md'); 
        } else if (defaultDir && defaultDirIsUrl) {
          link['link'] = urljoin(defaultDir, subCommand + '.md'); 
        } else {
          link['link'] = './' + command + '/' + subCommand + '.md'; 
        }
        links.push(link);
      })
    } 
    return links;
  }

  /**
   * Generate All
   * @param {[]} commandUsageLinks
   * @param {number} [headerDepth] Header depth, if provided, must be between 1-6 to represent h1-h6
   */
  getCommandUsageMarkdownLinks(commandUsageLinks, headerDepth) {
    let markdown = '';
    if (headerDepth) {
      if (typeof headerDepth !== 'number' || headerDepth < 1 || headerDepth > 6) {
        let errorMsg = 'Header Depth, must be between 1-6';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      markdown += '#'.repeat(headerDepth);
      markdown += ' Specific Command Usage\n\n'
    }

    let markdownLinks = []
    commandUsageLinks.forEach(link => {
      markdownLinks.push('- [' + link.name + '](' + link.link + ')');
    })

    return markdown + markdownLinks.join('\n');
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
      console.log(path.basename(file) + '\'s ' + replaceTag +  ' updated successfully!')
    } catch (error) {
      console.error('Error writing file: ' + path.basename(file), '\n', error);
    }
  }

}

new SetUsage();