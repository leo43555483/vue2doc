#!/usr/bin/env node

const program = require('commander');
const semver = require('semver');
const chalk = require('chalk');
const execa = require('execa');
const path = require('path');

const checkNodeVersion = (expect, target) => {
  if (!semver.satisfies(process.version, expect)) {
    console.log(
      chalk.red(`
      You are using Node ${process.version}, ${target} requires Node ${expect}\n
      please upgrade your Node version.
    `),
    );
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
  .action((entryPpath = '', cmd) => {
    console.log(chalk.green('initializing...'));
    const buildFilePath = path.join(__dirname, './create.js');
    const args = [buildFilePath, entryPpath, cmd.config || ''];
    execa('node', args, { stdio: 'inherit', cwd: process.cwd() })
      .then((result) => {
        if (result.failed) {
          process.exit(1);
        }
        console.log(chalk.green('success!'));
      })
      .catch(() => {
        console.log(chalk.red('build failed'));
      });
  });

program.parse(process.argv);
