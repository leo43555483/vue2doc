#!/usr/bin/env node

const program = require('commander');
const semver = require('semver');
const chalk = require('chalk');

const checkNodeVersion = (expect, target) => {
  if (!semver.satisfies(process.version, expect)) {
    console.log(chalk.red(`
      You are using Node ${process.version}, ${target} requires Node ${expect}\n
      please upgrade your Node version.
    `));
    process.exit(1);
  }
};
checkNodeVersion(require('../package.json').engines.node, 'vue2doc');

program
  .version(`${require('../package.json').version}`, '-v, --version')
  .usage('<command> [options]');


program
  .command('create [entryPpath]')
  .description('build vue documents')
  .option('--config <configPath>', 'Build the project through config')
  .allowUnknownOption()
  .action((entryPpath, cmd) => {
    console.log(chalk.green('building documents...'));
    require('../src/create.js')(entryPpath, cmd.config);
  });

program.parse(process.argv);
