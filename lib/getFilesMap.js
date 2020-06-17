const { join, resolve } = require('path');
const glob = require('glob');
const chalk = require('chalk');

const FILE_CONTEXT = 'vue2docs';
const {
  isExpectedFile,
  getFileNameFromUrl,
  getParentPathFromFile,
  hasOwnProperty,
  isFile,
  parsePath,
  isString,
} = require('./utils');

const INDEX_FILE_NAME = 'index';
function parseEntryUrl(file, output, map, context = false) {
  const urlPayload = getFileNameFromUrl(file);
  const filename = urlPayload.base;
  // webpack entry key
  let key;
  if (context) {
    key = `${filename}.doc`;
  } else if (output.path === 'self') {
    if (!isFile(file)) {
      key = `${filename}/${FILE_CONTEXT}/${filename}.doc`;
    } else {
      key = `${FILE_CONTEXT}/${filename}.doc`;
    }
  }
  // if (output.path !== 'self') {
  //   filename = isFile(filename) ? filename : parsePath(filename).base;
  //   key = join(process.cwd, output.path, `./${FILE_CONTEXT}`, `${filename}.doc`);
  // }
  map[key] = file;
}

function parseFile(entry, outputConfig, map) {
  const path = getParentPathFromFile(entry);
  parseEntryUrl(path, outputConfig, map, true);
  // map[path] = getFileNameFromUrl(entry).dir;
}
function getFilesMap(token, mimes, config) {
  const entry = token.entry || token;
  const outputConfig = token.output || config.output;
  const ignore = token.ignore || config.ignore;
  const map = {};

  if (isString(entry) && entry) {
    if (!isExpectedFile(entry, mimes)) {
      const path = join(`${process.cwd()}`, entry);
      const [indexFile] = glob.sync(`${path}/${INDEX_FILE_NAME}.@(${mimes.join('|')})`);

      if (indexFile) {
        parseFile(indexFile, outputConfig, map);
        return map;
      }
      let entryFiles = glob.sync(`${path}/*`);
      entryFiles = entryFiles.filter((filePath) => {
        // The path is a folder

        if (isFile(filePath) && !isExpectedFile(filePath, mimes)) return false;
        const lastFileName = parsePath(filePath).base;
        if (ignore.length > 0) {
          return ignore.indexOf(lastFileName) < 0 && lastFileName !== FILE_CONTEXT;
        }
        return true;
      });

      entryFiles.forEach((file) => {
        parseEntryUrl(file, outputConfig, map);
      });
    } else if (!hasOwnProperty(map, entry)) {
      parseFile(entry, outputConfig, map);
    }
  }
  return map;
}
module.exports = { getFilesMap, parseEntryUrl, FILE_CONTEXT };
