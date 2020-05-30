/* eslint-disable import/no-dynamic-require */
const path = require('path');
const chalk = require('chalk');
const merge = require('webpack-merge');
const build = require('./build.js');
const defaultConfig = require('../config/config.defualt');

const CONFIG_FILE_NAME = 'vue2doc.config.js';
module.exports = function (entry = null, config = null) {
  let configFile = config;
  if (!config) {
    const configPath = path.resolve(`${process.cwd()}`, `./${CONFIG_FILE_NAME}`);
    configFile = require(configPath) || {};
  }
  const entryFiles = entry || configFile.entry;
  if (!entryFiles) {
    console.log(chalk.red('Cannot find entry file.'));
    process.exit(1);
  }
  configFile = merge(defaultConfig, configFile);
  build(entryFiles, configFile);
};
