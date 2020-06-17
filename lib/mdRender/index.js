/* eslint-disable class-methods-use-this */
// const prettify = require('prettify-markdown');
const prettier = require('prettier');
const defaultConfig = require('./defaultOption');
const { unDef } = require('../utils');


class MdRender {
  constructor(option = defaultConfig) {
    this.option = Object.assign(defaultConfig, option);
    this.renderToMd = this.renderToMd.bind(this);
    this.renderContent = this.renderContent.bind(this);
  }

  renderTitle(title, tag) {
    if (!title) return '';
    return [tag, title].join(' ');
  }

  renderContent(data) {
    const context = this;
    const contents = Object.keys(data).map((key) => {
      const block = data[key];
      if (!block.value.length) return '';
      const title = context.renderTitle(block.title, block.titleTag);
      const table = context.renderTable(block.headers, block.value);

      return this.formatRow([title, table]);
    });
    return contents.join('  \n');
  }

  renderTableColum(content, index) {
    const inner = unDef(content) ? '-' : content;
    if (index === 0) return `|   ${String(inner)}   |`;
    return `   ${String(inner)}   |`;
  }

  formatRow(row) {
    return row.join('  \n');
  }

  renderTable(headers, data) {
    const context = this;

    const header = headers.map((head, index) => context.renderTableColum(head.name, index)).join('');
    const headerUnderLine = headers.map((head, index) => context.renderTableColum('--------', index)).join('');
    let body = data.map((item) => headers.map((head, index) => {
      const content = item[head.sourceKey];
      return context.renderTableColum(content, index);
    }).join(''));
    body = body.join('\n');
    return this.formatRow([header, headerUnderLine, body]);
  }

  pretty(str) {
    return prettier.format(str, { parser: 'markdown' });
  }

  renderToMd(data) {
    const { title, pageTitleTag } = this.option;
    const pageTitle = this.renderTitle(title, pageTitleTag);
    const content = this.renderContent(data);

    const markdown = this.formatRow([pageTitle, content]);
    return this.pretty(markdown);
  }
}

module.exports = MdRender;
