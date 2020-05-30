/* eslint-disable import/no-dynamic-require */
const Vue = require('vue');
const { isArray, parsePath } = require('./utils');

const fileEntryMap = process.FILE_ENTRY_MAP;
function parse() {
  // if (isArray(fileEntryMap)) {
  //   fileEntryMap.forEach((item) => {
  //     Object.keys(item).forEach((key) => {
  //       const url = fileEntryMap[key][1];
  //       console.log('url', url);
  //       const { base, dir } = parsePath(url);
  //       const context = require.context(`${dir}`, true);
  //       const vueConstructor = context.resolve(base);
  //       // vueConstructor = Vue.extends(vueConstructor);
  //       console.log('url??', vueConstructor);
  //     });
  //   });
  // }
}

module.exports = parse;
