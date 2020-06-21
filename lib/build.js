/* eslint-disable max-len */
const webpack = require('webpack');
const chalk = require('chalk');
const { fs } = require('./fileSystem');
const createEntryFile = require('./createEntryFile');
const getWebpackConfig = require('../config/webpack.build.config');
const { getFilesMap } = require('./getFilesMap');
const {
  isArray, isString, handleWebpackError, getOutPut,
} = require('./utils.js');

function getEntryOption(entryMap) {
  return {
    ...entryMap,
  };
}
function setFileSystem(compiler, systemFs) {
  compiler.inputFileSystem = systemFs;
  compiler.resolvers.normal.fileSystem = systemFs;
  compiler.resolvers.context.fileSystem = systemFs;
  compiler.resolvers.loader.fileSystem = systemFs;
}
module.exports = function (entry, config) {
  return new Promise((resolve, reject) => {
    let webpackEntry = [];
    const mimes = config.mime;
    if (isArray(entry)) {
      entry.forEach((item) => {
        webpackEntry.push(getEntryOption(getFilesMap(item, mimes, config)));
      });
    } else if (isString(entry)) {
      webpackEntry = getEntryOption(getFilesMap(entry, mimes, config));
    } else {
      throw new Error('[vue2doc]: Expected entry is string or array');
    }

    console.log(chalk.green('creating entry file....'));
    createEntryFile(webpackEntry)
      .then((freshEntry) => {
        const rootPath = process.cwd();
        const webpackConfig = freshEntry.map((entryMap, index) => {
          const entryPayload = isArray(entry) && entry[index] ? entry[index] : entry;
          const outPutPath = getOutPut(entryPayload, rootPath, config.output);
          return getWebpackConfig(entryMap, { path: outPutPath }, entry[index]);
        });
        // console.log('compiler.compilers', webpackConfig);
        const compiler = webpack(webpackConfig);
        if (isArray(compiler.compilers)) {
          compiler.compilers.forEach((item) => setFileSystem(item, fs));
        } else setFileSystem(compiler, fs);
        compiler.run((err, stats) => {
          const hasError = handleWebpackError(err, stats);
          if (hasError) reject(err);
          resolve();
        });
      })
      .catch((e) => {
        reject(e);
      });
  });
};
