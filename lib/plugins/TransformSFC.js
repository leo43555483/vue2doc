/* eslint-disable no-new-func */
/* eslint-disable class-methods-use-this */
const jsdom = require('jsdom');
const { Script } = require('vm');
const CommentParserConstructor = require('parse-comments');
const MdRender = require('../mdRender');
const {
  hasOwnProperty, isArray, isFunction, parsePath
} = require('../utils');
const DEFAULT_MD_OPTION = require('./config');
const { FILE_CONTEXT } = require('../getFilesMap');

const METHOD_EXPOSED = 'vue2doc-exposed-api';
const MODULE_EVENTS_CONTEXT = '@vue2docEvents';
const MODULE_METHODS_CONTEXT = '@vue2docMethods';
const MODE_MODULES_PATH = 'node_modules';
const PROPERTY_NAME = ['methods', 'props'];
class TransformSFC {
  constructor(option = DEFAULT_MD_OPTION) {
    this.instance = [];
    this._target = null;
    const { md, ...config } = option;
    this.option = { ...DEFAULT_MD_OPTION.output, ...config.output };
    this.mdRenderOption = this.mergeOption(md, DEFAULT_MD_OPTION.md);
    this.requestUrlMap = {};
  }

  apply(compiler) {
    compiler.hooks.entryOption.tap('mountEntry', (context, entry) => {
      this.genRequestMap(entry);
    });
    compiler.hooks.compilation.tap('TransformCompilation', (compilation) => {
      const context = this;
      compilation.hooks.seal.tap('sealResource', () => {
        compilation.modules.forEach((module) => {
          context.mountMethodsProperty(module);
          // context.mountSlotsProperty(module);
          context.mountEventsProperty(module);
        });
      });
    });
    compiler.hooks.emit.tapAsync('emitMarkDown', (compilation, callback) => {
      const { instance, mdRenderOption } = this;
      const eventList = this.getPropertyFromModule(compilation, MODULE_EVENTS_CONTEXT);
      const methodsList = this.getPropertyFromModule(compilation, MODULE_METHODS_CONTEXT);
      compilation.chunks.forEach((chunk) => {
        chunk.files.forEach((filename) => {
          try {
            this.runScript(compilation, filename, instance);
            this._target = this.instance.shift();
            const [eventMap] = eventList.filter((e) => e.name === filename);
            const [methodsMap] = methodsList.filter((e) => e.name === filename);
            const { name, ...properties } = this.getPropertyFromInstance(eventMap, methodsMap);
            if (properties) {
              const mdRender = new MdRender({ ...mdRenderOption, title: name });
              const mdContent = mdRender.renderToMd(properties);
              const outputFileName = this.parseFileName(name, filename);

              // console.log('compilation->>>>>>>>>>>>>>>>>>>>.', compilation.assets);
              compilation.assets[outputFileName] = {
                source() {
                  return mdContent;
                },
                size() {
                  return mdContent.length;
                },
              };
            }
            this.omitSourceFile(compilation, filename);
          } catch (error) {
            compilation.errors.push(error);
            throw error;
          }
        });
      });

      callback();
    });
  }

  omitSourceFile(compilation, fileId) {
    const re = /\.doc\.js$/;
    if (typeof fileId === 'string' && re.test(fileId)) {
      delete compilation.assets[fileId];
      return;
    }
    Object.keys(compilation.assets)
      .filter((asset) => re.test(asset))
      .forEach((sourceKey) => {
        delete compilation.assets[sourceKey];
      });
  }

  // mountSlotsProperty(module) {
  //   if (!module._source || !module._source._value || this.isNodeModules(module.context)) return;
  //   const source = module._source._value;
  //   const slotsExpressRe = /(\.\$slots.*)(?=[\b\s])/g;
  //   const scopedSlotsRe = /\.\$scopedSlots(.*)$/;
  //   const matchSlots = source.match(slotsExpressRe);
  //   const captureRe = (prefix) => new RegExp(`/(?:(\\.\\$${prefix}))(?:(\\.|\\[))([A-Za-z0-9]*)(?=[\b\\s])/`);
  //   if (matchSlots) {
  //     matchSlots.map((slot) => {
  //       const r = /(?:(\.\$slots))(?:(\.|\[))([A-Za-z0-9]*)(?=[\b\s])/.exec(slot);
  //       console.log('slotsExpressRe--------->>', slot, ' ', r);
  //       // console.log('bbbbbbbbbb', r);
  //       return slot;
  //     });
  //   }
  //   // source.match(slotsExpressRe).map();
  // }

  mountEventsProperty(module) {
    if (module._source._value) {
      const re = /\.\$emit\((.*?)\)/g;
      let emits = module._source._value.match(re);
      if (emits) {
        const name = this.findIssuerModule(module);
        if (name && !this.isNodeModules(module.context)) {
          emits = emits.map((emit) => {
            const result = /\.\$emit\((.*?)\)/g.exec(emit)[1];
            return result.split(',')[0].replace(/[\\']/g, '');
          });

          module[MODULE_EVENTS_CONTEXT] = { name, event: emits };
        }
      }
    }
  }

  mountMethodsProperty(module) {
    const methodMap = this.parseComments(module);
    console.log('commentsInfo', methodMap);
    if (methodMap !== null) {
      const name = this.findIssuerModule(module);
      module[MODULE_METHODS_CONTEXT] = { name, methodMap };
    }
  }

  isNodeModules(path) {
    return path.includes(MODE_MODULES_PATH);
  }

  parseComments(module) {
    if (!module._source || !module._source._value) return null;
    const source = module._source._value;
    const commentsParser = new CommentParserConstructor();
    const commentsInfo = commentsParser.parse(source);
    const map = {};
    const context = this;
    let flag = false;
    commentsInfo.forEach((comment) => {
      const [exposeTag] = comment.tags.filter(({ title }) => title.indexOf(METHOD_EXPOSED) >= 0);
      if (exposeTag) {
        flag = true;
        const methodName = exposeTag.title.split(':')[1];
        const { description } = comment;
        const params = [];
        let returnInfo = {};
        comment.tags.forEach((tag) => {
          if (tag.title === 'param') {
            const paramsInfo = context.formatParamFromComment(tag);

            params.push(paramsInfo);
          } else if (tag.title === 'return') {
            returnInfo = context.formatParamFromComment(tag);
          }
        });
        map[methodName] = {
          returnInfo,
          description,
          params,
        };
      }
    });
    return flag ? map : null;
  }

  formatParamFromComment(tag) {
    let type = tag.type.name;
    if (tag.type.elements && isArray(tag.type.elements)) {
      type = tag.type.elements.map((item) => item.name);
    }
    return {
      type,
      name: tag.name,
      description: tag.description,
    };
  }

  runScript(compilation, filename, instance) {
    try {
      const source = compilation.assets[filename].source();
      const { JSDOM } = jsdom;
      // prerender
      const dom = new JSDOM('<body id="app"></body>', {
        url: 'http://localhost',
        runScripts: 'dangerously',
      });
      const vmContext = dom.getInternalVMContext();
      const script = new Script(`
        new Function(this.source)(this.instance);
      `);
      script.runInContext(Object.assign(vmContext, { source, instance }));
    } catch (error) {
      compilation.errors.push(error);
    }
  }

  mergeOption(origin, target) {
    if (origin === target || !origin) return target;
    const result = {};
    Object.keys(origin).forEach((key) => {
      if (hasOwnProperty(target, key)) {
        result[key] = {
          ...target[key],
          ...origin[key],
        };
      }
    });
    return result;
  }

  findIssuerModule(issuer) {
    let module = issuer;
    let result = null;
    while (module && module.rawRequest) {
      const { rawRequest } = module;
      if (!hasOwnProperty(this.requestUrlMap, rawRequest)) {
        module = module.issuer;
      } else {
        result = this.requestUrlMap[rawRequest];
        break;
      }
    }
    return result;
  }

  getPropertyFromModule(compilation, propertyName) {
    const list = [];
    compilation._modules.forEach((module) => {
      if (hasOwnProperty(module, propertyName)) {
        list.push(module[propertyName]);
      }
    });
    return list.filter((item) => item);
  }

  genRequestMap(entry) {
    const context = this;
    Object.keys(entry).forEach((key) => {
      const fileName = /\.js$/.test(key) ? key : `${key}.js`;
      context.requestUrlMap[entry[key]] = fileName;
    });
  }

  parseFileName(name, assetFileName) {
    const { filename, dirname } = this.option;
    let basename;
    if (filename === '[name]') {
      basename = name;
    } else {
      basename = filename;
    }
    const path = parsePath(assetFileName).dir.replace(FILE_CONTEXT, '');
    return `${path}${dirname}${basename}.md`;
  }

  getProps(component) {
    const getType = (value) => {
      if (!value) return '';
      if (isArray(value)) return value.map((type) => type.name).join(' ');
      return value.name;
    };
    if (component.props) {
      const keys = Object.keys(component.props);
      return keys.map((key) => {
        const payload = { ...component.props[key] };
        const { type, ...values } = payload;
        let defaultvalue = payload.default;
        if (isFunction(defaultvalue) && getType(type) !== 'Function') {
          defaultvalue = defaultvalue();
        }

        return {
          key,
          ...values,
          default: defaultvalue,
          type: getType(type),
        };
      });
    }
    return [];
  }

  getMethods(component, { methodMap = {} }) {
    const exposedName = Object.keys(methodMap);
    const formatParam = (param) => param
      .map((item) => {
        const { name } = item;
        let { type } = item;
        if (isArray(type)) {
          type = type.join('|');
          return `${name}: ${type}`;
        }
        return name || type;
      })
      .join('<br>');
    if (component.methods && exposedName.length) {
      return exposedName
        .map((methodName) => {
          if (hasOwnProperty(component.methods, methodName)) {
            const methodInfo = methodMap[methodName];
            return {
              key: methodName,
              params: formatParam(methodInfo.params),
              return: methodInfo.returnInfo.type,
              description: methodInfo.description,
            };
          }
          return null;
        })
        .filter((item) => item !== null);
    }
    return [];
  }

  recursiveMerge(mixins, obj, targetPropertyName) {
    if (mixins && isArray(mixins) && mixins.length) {
      for (let i = 0; i < mixins.length; i++) {
        const item = mixins[i];

        for (let j = 0; j < targetPropertyName.length; j++) {
          const key = targetPropertyName[j];

          if (hasOwnProperty(item, key) && hasOwnProperty(obj, key)) {
            const targetObj = obj[key];

            Object.keys(item[key]).forEach((propertyName) => {
              if (!hasOwnProperty(targetObj, propertyName)) {
                targetObj[propertyName] = item[key][propertyName];
              }
            });
          }
        }
        if (item.mixins) this.recursiveMerge(item.mixins, obj, targetPropertyName);
      }
    }
  }

  mergePropertyFromMixin(component) {
    const result = {};
    const targetPropertyName = PROPERTY_NAME;
    targetPropertyName.forEach((key) => {
      if (hasOwnProperty(component, key)) {
        result[key] = { ...component[key] };
      } else {
        result[key] = {};
      }
    });
    const { mixins } = component;
    if (isArray(mixins) && mixins.length) {
      this.recursiveMerge(mixins, result, targetPropertyName);
    }
    return result;
  }

  getPropertyFromInstance(eventsMap = {}, methodsMap = {}) {
    const { _target, mdRenderOption } = this;
    if (!_target) return {};
    // console.log('_target.component>>>>>>>', _target.component);
    const property = this.mergePropertyFromMixin(_target.component);
    const props = this.getProps(property);

    const methods = this.getMethods(property, methodsMap);
    let events = [];
    if (hasOwnProperty(eventsMap, 'event')) {
      events = eventsMap.event.map((event) => ({ key: event.replace(/("|')/g, '') }));
    }

    const { name } = _target.component;
    const format = (mdConfig, value) => ({ ...mdConfig, value });
    return {
      props: format(mdRenderOption.props, props),
      methods: format(mdRenderOption.methods, methods),
      events: format(mdRenderOption.events, events),
      name,
    };
  }
}

module.exports = TransformSFC;
