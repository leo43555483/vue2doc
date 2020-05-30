/* eslint-disable max-len */
const webpack = require('webpack');
const chalk = require('chalk');
const { join } = require('path');
const glob = require('glob');
const parse = require('./parse');

const getWebpackConfig = require('../config/webpack.build.config');
const {
  isArray,
  isString,
  isExpectedFile,
  getFileNameFromUrl,
  getParentPathFromFile,
  hasOwnProperty,
  isFile,
  handleWebpackError,
  getOutPut,
  parsePath,
} = require('./utils.js');


function getFiles(token, mimes, config) {
  const { entry } = token;
  const ignore = token.ignore || config.ignore;
  const map = {};
  if (isString(entry) && entry) {
    if (!isExpectedFile(entry, mimes)) {
      const path = join(`${process.cwd()}`, entry);
      let entryFiles = glob.sync(`${path}/*`);

      entryFiles = entryFiles.filter((filePath) => {
        // The path is a folder
        if (!isFile(filePath)) {
          const lastFileName = parsePath(filePath).base;
          if (ignore.length > 0) {
            return ignore.indexOf(lastFileName) < 0;
          }
          return true;
        }

        const { ext } = getFileNameFromUrl(filePath);
        return mimes.indexOf(ext);
      });

      entryFiles.forEach((file) => {
        const urlPayload = getFileNameFromUrl(file);
        let filename = urlPayload.base;
        // console.log('getFileNameFromUrl', getFileNameFromUrl(file));
        // webpack entry key
        let key = `${filename}/docs/${filename}.doc`;

        if (config.output !== 'self') {
          filename = isFile(filename) ? filename : parsePath(filename).base;
          key = join(process.cwd, config.output);
        }
        if (!hasOwnProperty(map, filename)) {
          map[key] = [join(__dirname, './parse.js'), file];
        }
      });
    } else if (!hasOwnProperty(map, entry)) {
      const path = getParentPathFromFile(entry);
      map[path] = [join(__dirname, './parse.js'), entry];
    }
  }
  return map;
}

function getEntryOption(entryMap) {
  return {
    // parse: join(__dirname, './parse.js'),
    ...entryMap,
  };
}
module.exports = function (entry, config) {
  let webpackEntry = [];
  const mimes = config.mime;
  if (isArray(entry)) {
    entry.forEach((item) => {
      webpackEntry.push(getEntryOption(getFiles(item, mimes, config)));
    });
  } else if (isString(entry)) {
    webpackEntry = getEntryOption(getFiles(entry, mimes, config));
  }
  process.FILE_ENTRY_MAP = webpackEntry;
  console.log('webpackEntry', webpackEntry);
  const rootPath = process.cwd();
  parse(webpackEntry);
  let webpackConfig;
  if (isArray(webpackEntry)) {
    webpackConfig = webpackEntry.map((entryMap, index) => {
      const outPutPath = getOutPut(entry[index], rootPath, config.output);
      // console.log('outPutPath', outPutPath);
      return getWebpackConfig(entryMap, { path: outPutPath });
    });
  } else {
    const outPutPath = getOutPut(config, rootPath);
    webpackConfig = getWebpackConfig(webpackEntry, { path: outPutPath });
  }
  // console.log(chalk.green('webpackConfig'), webpackConfig);
  const compiler = webpack(webpackConfig);

  compiler.run((err, stats) => {
    handleWebpackError(err, stats);
  });
};
