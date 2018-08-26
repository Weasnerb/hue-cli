# hue-cli-extended

[![NPM version](https://img.shields.io/npm/v/@weasnerb/hue-cli-extended.svg)](https://www.npmjs.com/package/@weasnerb/hue-cli-extended)
![Node version](https://img.shields.io/badge/node-%3E%3D5.0.0-brightgreen.svg)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Simple command line interface for Philips Hue.

## Installation

```bash
npm install -g @weasnerb/hue-cli-extended
```

### Usage

> Note: Each command also has a -h flag for extra help!

```text
  Usage: hue <command> [options]

  Simple command line interface for Philips Hue

  Options:

    --debug                     output errors to log file
    -v, --version               output the version number
    -h, --help                  output usage information

  Commands:

    setup [options]             Configure hue bridge or show current config
    on [room] [otherRooms...]   Turn on all lights, or turn on lights in specific room(s)
    off [room] [otherRooms...]  Turn off all lights, or turn off lights in specific room(s)
    scene|s [options] [name]    Activate scene starting with <name>
    user|u [options]            View and unregister users on bridge
```
