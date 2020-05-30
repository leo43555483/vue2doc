// const chalk = require('chalk');
const { join } = require('path');
const { parse } = require('path');

const hasOwnProperty = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

function parsePath(path) {
  return parse(path);
}
function getFileNameFromUrl(path) {
  return parsePath(path);
}
function getParentPathFromFile(entry) {
  let folder = entry.split('/');
  folder.pop();
  folder = folder.join('/');
  return folder;
}
function isExpectedFile(path, mimes) {
  return mimes.some((mime) => {
    const re = new RegExp(`.${mime}$`);
    return re.test(path);
  });
}
function isFile(path) {
  return /\.[A-Za-z]+$/.test(path);
}
function isArray(value) {
  return Array.isArray(value);
}
function isString(value) {
  return typeof value === 'string';
}
function handleWebpackError(err, stats) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
}
function getOutPut(config, rootPath, output) {
  if (config.output === 'self' || output === 'self') return join(rootPath, config.entry);
  if (isString(config.output)) return join(rootPath, config.output);
  return rootPath;
}
module.exports = {
  isExpectedFile,
  isArray,
  isString,
  hasOwnProperty,
  getParentPathFromFile,
  getFileNameFromUrl,
  isFile,
  handleWebpackError,
  getOutPut,
  parsePath,
};
