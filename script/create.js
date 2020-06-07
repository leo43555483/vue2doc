/* eslint-disable import/no-dynamic-require */
const path = require('path');
const chalk = require('chalk');
const merge = require('webpack-merge');
const build = require('vue2doc-utils');
const defaultConfig = require('vue2doc-utils/config/config.defualt');

const CONFIG_FILE_NAME = 'vue2doc.config.js';
const loadConfig = (configPath = '') => {
  const targetPath = path.resolve(`${process.cwd()}`, `./${configPath}`);
  return require(targetPath) || {};
};
function create() {
  const args = process.argv.slice(2);
  const [entryPath = null, config = null] = args;
  let configFile = config;
  if (!config) {
    configFile = loadConfig(CONFIG_FILE_NAME);
  } else {
    configFile = loadConfig(config);
  }
  const entryFiles = entryPath || configFile.entry;
  if (!entryFiles) {
    process.exit(1);
  }

  configFile = merge(defaultConfig, configFile);
  build(entryFiles, configFile)
    .then()
    .catch(e => {
      if (e.message === '100') {
        process.exit(1);
      }
    });
}

create();
