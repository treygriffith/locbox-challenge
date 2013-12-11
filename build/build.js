
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // Note: when moving children, don't rely on el.children\n\
  // being 'live' to support Polymer's broken behaviour.\n\
  // See: https://github.com/component/domify/pull/23\n\
  if (1 == el.children.length) {\n\
    return el.removeChild(el.children[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.children.length) {\n\
    fragment.appendChild(el.removeChild(el.children[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("treygriffith-closest/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
module.exports = function (element, selector, checkYoSelf, root) {\n\
  element = checkYoSelf ? {parentNode: element} : element\n\
\n\
  root = root || document\n\
\n\
  // Make sure `element !== document` and `element != null`\n\
  // otherwise we get an illegal invocation\n\
  while ((element = element.parentNode) && element !== document) {\n\
\n\
    // document fragments cause illegal invocation\n\
    // in matches, so we skip them\n\
    if(element.nodeType === 11)\n\
      continue\n\
  \n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return  \n\
  }\n\
}//@ sourceURL=treygriffith-closest/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"\n\
/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("component-clone/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var type;\n\
\n\
try {\n\
  type = require('type');\n\
} catch(e){\n\
  type = require('type-component');\n\
}\n\
\n\
/**\n\
 * Module exports.\n\
 */\n\
\n\
module.exports = clone;\n\
\n\
/**\n\
 * Clones objects.\n\
 *\n\
 * @param {Mixed} any object\n\
 * @api public\n\
 */\n\
\n\
function clone(obj){\n\
  switch (type(obj)) {\n\
    case 'object':\n\
      var copy = {};\n\
      for (var key in obj) {\n\
        if (obj.hasOwnProperty(key)) {\n\
          copy[key] = clone(obj[key]);\n\
        }\n\
      }\n\
      return copy;\n\
\n\
    case 'array':\n\
      var copy = new Array(obj.length);\n\
      for (var i = 0, l = obj.length; i < l; i++) {\n\
        copy[i] = clone(obj[i]);\n\
      }\n\
      return copy;\n\
\n\
    case 'regexp':\n\
      // from millermedeiros/amd-utils - MIT\n\
      var flags = '';\n\
      flags += obj.multiline ? 'm' : '';\n\
      flags += obj.global ? 'g' : '';\n\
      flags += obj.ignoreCase ? 'i' : '';\n\
      return new RegExp(obj.source, flags);\n\
\n\
    case 'date':\n\
      return new Date(obj.getTime());\n\
\n\
    default: // string, number, boolean, …\n\
      return obj;\n\
  }\n\
}\n\
//@ sourceURL=component-clone/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
  return exports;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("component-css/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Properties to ignore appending \"px\".\n\
 */\n\
\n\
var ignore = {\n\
  columnCount: true,\n\
  fillOpacity: true,\n\
  fontWeight: true,\n\
  lineHeight: true,\n\
  opacity: true,\n\
  orphans: true,\n\
  widows: true,\n\
  zIndex: true,\n\
  zoom: true\n\
};\n\
\n\
/**\n\
 * Set `el` css values.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} obj\n\
 * @return {Element}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el, obj){\n\
  for (var key in obj) {\n\
    var val = obj[key];\n\
    if ('number' == typeof val && !ignore[key]) val += 'px';\n\
    el.style[key] = val;\n\
  }\n\
  return el;\n\
};\n\
//@ sourceURL=component-css/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("treygriffith-events/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
var event = require('event');\n\
\n\
/**\n\
 * Exports\n\
 */\n\
module.exports = Events;\n\
\n\
/**\n\
 * Create a new events manager\n\
 */\n\
function Events() {\n\
  this._nodes = [];\n\
  this._events = [];\n\
}\n\
\n\
/**\n\
 * Bind event listener to an element\n\
 * @api public\n\
 * @param  {DOM Node}   el  DOM Node to add a listener to\n\
 * @param  {String}   evt Event to listen for.\n\
 * @param  {Function} fn  Callback to be triggered when the event occurs.\n\
 * @return {Function}       Attached listener\n\
 */\n\
Events.prototype.bind = function (el, evt, fn) {\n\
  var events = this._initNode(el);\n\
\n\
  events[evt] = events[evt] || [];\n\
  events[evt].push(fn);\n\
\n\
  event.bind(el, evt, fn);\n\
\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind event listener(s) from an element\n\
 * @api public\n\
 * @param  {DOM Node}   el  DOM Node to remove listeners from\n\
 * @param  {String}   evt Optional event to remove listeners for. If omitted, removes listeners for all events\n\
 * @param  {Function} fn  Specific listener to remove. If omitted, removes all listeners for an event\n\
 * @return {Array}       Listeners removed\n\
 */\n\
Events.prototype.unbind = function (el, evt, fn) {\n\
  var unbound = []\n\
    , events\n\
    , i;\n\
\n\
  if(!~this._nodes.indexOf(el)) return unbound;\n\
\n\
  events = this._events[this._nodes.indexOf(el)];\n\
\n\
  if(!evt) {\n\
    for(evt in events) {\n\
      unbound = unbound.concat(this.unbind(el, evt, fn));\n\
    }\n\
\n\
    return unbound;\n\
  }\n\
  \n\
  if(!events[evt] || !events[evt].length) return unbound;\n\
\n\
  i = events[evt].length;\n\
\n\
  while(i--) {\n\
    if(!fn || fn === events[evt][i]) {\n\
      event.unbind(el, evt, events[evt][i]);\n\
      unbound.push(events[evt][i]);\n\
      events[evt].splice(i, 1);\n\
    }\n\
  }\n\
\n\
  return unbound;\n\
};\n\
\n\
/**\n\
 * Initialize event management for a DOM node\n\
 * @api private\n\
 * @param  {DOM Node} el DOM node to manage events for\n\
 * @return {Object}    Dictionary of events managed for this element\n\
 */\n\
Events.prototype._initNode = function (el) {\n\
  var index = this._nodes.indexOf(el);\n\
\n\
  if(!~index) index = (this._nodes.push(el) - 1);\n\
\n\
  this._events[index] = this._events[index] || {};\n\
\n\
  return this._events[index];\n\
};\n\
\n\
//@ sourceURL=treygriffith-events/index.js"
));
require.register("ramitos-children/src/children.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
// same code as jquery with just the adition of selector matching\n\
module.exports = function (el, selector) {\n\
  var n = el.firstChild\n\
  var matched = [];\n\
\n\
  for(; n; n = n.nextSibling) {\n\
    if(n.nodeType === 1 && (!selector || (selector && matches(n, selector))))\n\
      matched.push(n)\n\
  }\n\
\n\
  return matched\n\
}//@ sourceURL=ramitos-children/src/children.js"
));
require.register("ramitos-siblings/src/siblings.js", Function("exports, require, module",
"var children = require('children')\n\
\n\
module.exports = function (el, selector) {\n\
  return children(el.parentNode, selector).filter(function (sibling) {\n\
    return sibling !== el\n\
  })\n\
}//@ sourceURL=ramitos-siblings/src/siblings.js"
));
require.register("timoxley-to-array/index.js", Function("exports, require, module",
"/**\n\
 * Convert an array-like object into an `Array`.\n\
 * If `collection` is already an `Array`, then will return a clone of `collection`.\n\
 *\n\
 * @param {Array | Mixed} collection An `Array` or array-like object to convert e.g. `arguments` or `NodeList`\n\
 * @return {Array} Naive conversion of `collection` to a new `Array`.\n\
 * @api private\n\
 */\n\
\n\
module.exports = function toArray(collection) {\n\
  if (typeof collection === 'undefined') return []\n\
  if (collection === null) return [null]\n\
  if (collection === window) return [window]\n\
  if (typeof collection === 'string') return [collection]\n\
  if (Array.isArray(collection)) return collection.slice()\n\
  if (typeof collection.length != 'number') return [collection]\n\
  if (typeof collection === 'function') return [collection]\n\
\n\
  var arr = []\n\
  for (var i = 0; i < collection.length; i++) {\n\
    if (collection.hasOwnProperty(i) || i in collection) {\n\
      arr.push(collection[i])\n\
    }\n\
  }\n\
  if (!arr.length) return []\n\
  return arr\n\
}\n\
//@ sourceURL=timoxley-to-array/index.js"
));
require.register("ForbesLindesay-to-element-array/index.js", Function("exports, require, module",
"var toArray = require('to-array');\n\
\n\
module.exports = toElementArray;\n\
function toElementArray(elements) {\n\
  if (typeof elements === 'string') {\n\
    return toArray(document.querySelectorAll(elements));\n\
  } else {\n\
    return toArray(elements);\n\
  }\n\
}//@ sourceURL=ForbesLindesay-to-element-array/index.js"
));
require.register("treygriffith-find-with-self/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
  , query = require('query')\n\
  , toArray = require('to-element-array');\n\
\n\
module.exports = findWithSelf;\n\
\n\
function findWithSelf(el, selector) {\n\
  var selected = toArray(query.all(selector, el));\n\
\n\
  if(matches(el, selector)) selected.push(el);\n\
  \n\
  return selected;\n\
}//@ sourceURL=treygriffith-find-with-self/index.js"
));
require.register("matthewp-attr/index.js", Function("exports, require, module",
"/*\n\
** Fallback for older IE without get/setAttribute\n\
 */\n\
function fetch(el, attr) {\n\
  var attrs = el.attributes;\n\
  for(var i = 0; i < attrs.length; i++) {\n\
    if (attr[i] !== undefined) {\n\
      if(attr[i].nodeName === attr) {\n\
        return attr[i];\n\
      }\n\
    }\n\
  }\n\
  return null;\n\
}\n\
\n\
function Attr(el) {\n\
  this.el = el;\n\
}\n\
\n\
Attr.prototype.get = function(attr) {\n\
  return (this.el.getAttribute && this.el.getAttribute(attr))\n\
    || (fetch(this.el, attr) === null ? null : fetch(this.el, attr).value);\n\
};\n\
\n\
Attr.prototype.set = function(attr, val) {\n\
  if(this.el.setAttribute) {\n\
    this.el.setAttribute(attr, val);\n\
  } else {\n\
    fetch(this.el, attr).value = val;\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
Attr.prototype.has = function(attr) {\n\
  return (this.el.hasAttribute && this.el.hasAttribute(attr))\n\
    || fetch(this.el, attr) !== null;\n\
};\n\
\n\
module.exports = function(el) {\n\
  return new Attr(el);\n\
};\n\
\n\
module.exports.Attr = Attr;\n\
//@ sourceURL=matthewp-attr/index.js"
));
require.register("matthewp-text/index.js", Function("exports, require, module",
"\n\
var text = 'innerText' in document.createElement('div')\n\
  ? 'innerText'\n\
  : 'textContent'\n\
\n\
module.exports = function (el, val) {\n\
  if (val == null) return el[text];\n\
  el[text] = val;\n\
};\n\
//@ sourceURL=matthewp-text/index.js"
));
require.register("component-value/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var typeOf = require('type');\n\
\n\
/**\n\
 * Set or get `el`'s' value.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Mixed} val\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el, val){\n\
  if (2 == arguments.length) return set(el, val);\n\
  return get(el);\n\
};\n\
\n\
/**\n\
 * Get `el`'s value.\n\
 */\n\
\n\
function get(el) {\n\
  switch (type(el)) {\n\
    case 'checkbox':\n\
    case 'radio':\n\
      if (el.checked) {\n\
        var attr = el.getAttribute('value');\n\
        return null == attr ? true : attr;\n\
      } else {\n\
        return false;\n\
      }\n\
    case 'radiogroup':\n\
      for (var i = 0, radio; radio = el[i]; i++) {\n\
        if (radio.checked) return radio.value;\n\
      }\n\
      break;\n\
    case 'select':\n\
      for (var i = 0, option; option = el.options[i]; i++) {\n\
        if (option.selected) return option.value;\n\
      }\n\
      break;\n\
    default:\n\
      return el.value;\n\
  }\n\
}\n\
\n\
/**\n\
 * Set `el`'s value.\n\
 */\n\
\n\
function set(el, val) {\n\
  switch (type(el)) {\n\
    case 'checkbox':\n\
    case 'radio':\n\
      if (val) {\n\
        el.checked = true;\n\
      } else {\n\
        el.checked = false;\n\
      }\n\
      break;\n\
    case 'radiogroup':\n\
      for (var i = 0, radio; radio = el[i]; i++) {\n\
        radio.checked = radio.value === val;\n\
      }\n\
      break;\n\
    case 'select':\n\
      for (var i = 0, option; option = el.options[i]; i++) {\n\
        option.selected = option.value === val;\n\
      }\n\
      break;\n\
    default:\n\
      el.value = val;\n\
  }\n\
}\n\
\n\
/**\n\
 * Element type.\n\
 */\n\
\n\
function type(el) {\n\
  var group = 'array' == typeOf(el) || 'object' == typeOf(el);\n\
  if (group) el = el[0];\n\
  var name = el.nodeName.toLowerCase();\n\
  var type = el.getAttribute('type');\n\
\n\
  if (group && type && 'radio' == type.toLowerCase()) return 'radiogroup';\n\
  if ('input' == name && type && 'checkbox' == type.toLowerCase()) return 'checkbox';\n\
  if ('input' == name && type && 'radio' == type.toLowerCase()) return 'radio';\n\
  if ('select' == name) return 'select';\n\
  return name;\n\
}\n\
//@ sourceURL=component-value/index.js"
));
require.register("treygriffith-oz/index.js", Function("exports, require, module",
"module.exports = require('./lib/oz');//@ sourceURL=treygriffith-oz/index.js"
));
require.register("treygriffith-oz/lib/oz.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var Emitter = require('emitter')\n\
  , Events = require('events')\n\
  , domify = require('domify')\n\
  , closest = require('closest')\n\
  , children = require('children')\n\
  , matches = require('matches-selector')\n\
  , clone = require('clone')\n\
  , findWithSelf = require('find-with-self')\n\
  , attr = require('attr')\n\
  , utils = require('./utils')\n\
  , tags = require('./tags');\n\
\n\
/**\n\
 * Exports\n\
 */\n\
\n\
module.exports = Oz;\n\
\n\
/**\n\
 * Template constructor\n\
 * @param {String | DOM} template Representation of the template,\n\
 * either as a string or a DOM node (or document fragment of several DOM nodes)\n\
 * \n\
 * properties:\n\
 *   thisSymbol: Symbol used in template declarations to indicate that the current context is to be used as the value.\n\
 *     default: '@'\n\
 *   separator: Symbol used to separate attributes\n\
 *     default: ';'\n\
 *   equals: Symbol used to separate attribute name from value\n\
 *     default: ':'\n\
 *   template: DOM element(s) that represent the template to be rendered\n\
 *   tags: Object defining how tags are notated and rendered\n\
 *     default: Oz.tags\n\
 *   cached: internal cache of already rendered DOM elements\n\
 *   rendered: the template's output, for use in updates\n\
 *   \n\
 */\n\
function Oz(template) {\n\
  if(!(this instanceof Oz)) return new Oz(template);\n\
  this.thisSymbol = '@';\n\
  this.equals = ':';\n\
  this.separator = ';';\n\
  this.template = typeof template === 'string' ? domify(template) : template;\n\
  this.tags = clone(Oz.tags);\n\
  this.events = new Events();\n\
  this.cached = [];\n\
}\n\
\n\
Emitter(Oz.prototype);\n\
\n\
/**\n\
 * Template render\n\
 * @api public\n\
 * @param  {Object} ctx Context in which to render the template\n\
 * @return {DOMFragment}     Document fragment containing rendered nodes\n\
 */\n\
Oz.prototype.render = function (ctx) {\n\
  var self = this\n\
    , template = this.template.cloneNode(true)\n\
    , fragment;\n\
\n\
  if(isFragment(template)) {\n\
    fragment = template;\n\
  } else {\n\
    fragment = document.createDocumentFragment();\n\
    fragment.appendChild(template);\n\
  }\n\
\n\
  this.rendered = children(fragment);\n\
\n\
  this.update(ctx);\n\
\n\
  return fragment;\n\
};\n\
\n\
/**\n\
 * Update template\n\
 * @api public\n\
 * @param  {Object} ctx Context in which to render the template\n\
 * @return {Array}     Array of rendered elements corresponding to the updated (in-place) template\n\
 */\n\
Oz.prototype.update = function (ctx) {\n\
  var self = this;\n\
\n\
  this.ctx = ctx || {};\n\
  this.cache = [];\n\
\n\
  this.rendered.forEach(function (el) {\n\
    unbindAll(self.events, el);\n\
    self._render(el, ctx);\n\
  });\n\
\n\
  return this.rendered;\n\
};\n\
\n\
/**\n\
 * Update coming from the template\n\
 * @api private\n\
 */\n\
Oz.prototype._change = function (scope, val) {\n\
  this.emit('change:'+scope, val); // triggers `.on('change:person.name')` with `'Brian'`\n\
  this.emit('change', scope, val); // triggers `.on('change')` with `('person.name', 'Brian')`\n\
};\n\
\n\
/**\n\
 * Internal iterative rendering\n\
 * @api private\n\
 * @param  {DOM} template    DOM node to be rendered\n\
 * @param  {Object} ctx         Context in which the template should be rendered\n\
 * @param  {Boolean} ignoreCache Flag determining if this template should be re-rendered if it has already been rendered.\n\
 *                               This is to allow tags that change scope (oz and oz-each) to make sure that the subordinate nodes are rendered properly\n\
 * @return {DOM}             Rendered template\n\
 */\n\
Oz.prototype._render = function (template, ctx, scope, ignoreCache) {\n\
  var self = this\n\
    , tags = this.tags\n\
    , thisSymbol = this.thisSymbol\n\
    , tagKeys = Object.keys(tags)\n\
    , tmp;\n\
\n\
  scope = scope || '';\n\
\n\
  // NOTE: what impact does this caching have on multiple tags on the same html element?\n\
  if(~this.cache.indexOf(template) && !ignoreCache) {\n\
    return this.cache[this.cache.indexOf(template)];\n\
  }\n\
\n\
  tagKeys.forEach(function (key) {\n\
    // TODO: add compatibility for data-* attributes\n\
    var selector = '[' + tags[key].attr + ']' + (tags[key].not ? ':not(' + tags[key].not + ')' : '');\n\
    \n\
    findWithSelf(template, selector).filter(filterRoot(tags, template)).forEach(function (el) {\n\
      var prop = attr(el).get(tags[key].attr)\n\
        , next = function (_el, _ctx, _scope) {\n\
          // replace empty arguments with defaults\n\
          // fall through for lower argument lengths to pick up all the defaults\n\
          switch(arguments.length) {\n\
            case 0:\n\
              _el = el;\n\
            case 1:\n\
              _ctx = ctx;\n\
            case 2:\n\
              _scope = scope;\n\
          }\n\
\n\
          // render this element's children\n\
          children(_el).forEach(function (child) {\n\
            // ignore cache on context change\n\
            self._render(child, _ctx, _scope, (_scope !== scope && _ctx !== ctx));\n\
          });\n\
        };\n\
\n\
      tags[key].render.call(self, el, ctx, prop, scope, next);\n\
    });\n\
  });\n\
\n\
  this.cache.push(template);\n\
\n\
  return this.cache[this.cache.length - 1];\n\
};\n\
\n\
/**\n\
 * Shortcut to creating and rendering a template\n\
 * @api public\n\
 * @param  {String | DOM} template The string or DOM node(s) representing the template\n\
 * @param  {Object} ctx      context in which the template should be rendered\n\
 * @return {Array}          Array of DOM nodes of the rendered template\n\
 */\n\
Oz.render = function (template, ctx) {\n\
  return (new Oz(template)).render(ctx);\n\
};\n\
\n\
/**\n\
 * Default template options\n\
 * updating tags on the constructor will update the tags for all templates created thereafter\n\
 */\n\
Oz.tags = tags;\n\
\n\
/**\n\
 * Utilities for extended tags to use\n\
 */\n\
for(var p in utils) Oz[p] = utils[p];\n\
\n\
\n\
/**\n\
 * Utility functions\n\
 */\n\
\n\
// unbind all event listeners from this node and all descendents\n\
function unbindAll(events, el) {\n\
  findWithSelf(el, '*').forEach(function (el) {\n\
    events.unbind(el);\n\
  });\n\
}\n\
\n\
\n\
// check if the DOM node is a document fragment\n\
function isFragment(el) {\n\
  return el.nodeType === 11;\n\
}\n\
\n\
// filter nodes that are not at the top level of tags\n\
function filterRoot(tags, root) {\n\
  var tagKeys = Object.keys(tags);\n\
\n\
  return function (el) {\n\
    for(var i=0; i<tagKeys.length; i++) {\n\
\n\
      var closestEl = closest(el, '[' + tags[tagKeys[i]].attr + ']', true, root);\n\
\n\
      if(closestEl != null && closestEl !== el) return false;\n\
    }\n\
\n\
    return true;\n\
  };\n\
}//@ sourceURL=treygriffith-oz/lib/oz.js"
));
require.register("treygriffith-oz/lib/tags.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var attr = require('attr')\n\
  , text = require('text')\n\
  , value = require('value')\n\
  , css = require('css')\n\
  , matches = require('matches-selector')\n\
  , children = require('children')\n\
  , siblings = require('siblings')\n\
  , utils = require('./utils');\n\
\n\
/**\n\
 * Default template options\n\
 *\n\
 * Tag properties:\n\
 *   attr: String - html attribute name that denotes this tag and stores its value\n\
 *   not: String - CSS selector that describes which nodes with `attr` should be ignored when rendering or updating\n\
 *   render: Function - evaluated when a node is rendered or updated. Should accept 5 arguments:\n\
 *     el: DOM node currently rendering\n\
 *     ctx: Object - describes the the context that this node is being rendered in\n\
 *     prop: String - the value of the attribute tag\n\
 *     scope: String - represents the current context tree (e.g. \"people.1.name\")\n\
 *     next: Function - should be evaluated after the node has been rendered with 3 arguments:\n\
 *       el: the element that has been rendered - default: current el\n\
 *       ctx: the context of this `el`'s children - default: current context\n\
 *       scope: the scope of this `el`'s children - default: current scope\n\
 */\n\
\n\
var tags = module.exports = {\n\
\n\
  /**\n\
   * Render an attribute\n\
   * template: <img oz-attr=\"src:mysrc;class:myclass\" />\n\
   * context: { mysrc: \"something.jpg\", myclass: \"photo\" }\n\
   * output: <img src=\"something.jpg\" class=\"photo\" />\n\
   */\n\
  attr: {\n\
    attr: 'oz-attr',\n\
    render: function (el, ctx, prop, scope, next) {\n\
\n\
      var self = this;\n\
\n\
      utils.propSplit(prop, this.separator, this.equals, function (name, val) {\n\
        val = val != null ? utils.get(ctx, val, self.thisSymbol) : null;\n\
\n\
        if(attr(el).get(name) !== val) attr(el).set(name, val);\n\
      });\n\
\n\
      next();\n\
    }\n\
  },\n\
\n\
  /**\n\
   * Namespace subordinate nodes to this object\n\
   * template: <div oz=\"person\"><p oz-text=\"name\"></p></div>\n\
   * context: { person: {name: 'Tobi'} }\n\
   * output: <div oz=\"person\"><p oz-text=\"name\">Tobi</p></div>\n\
   */\n\
  object: {\n\
    attr: 'oz',\n\
    render: function (el, ctx, prop, scope, next) {\n\
      var val = utils.get(ctx, prop, this.thisSymbol)\n\
        , self = this;\n\
\n\
      scope = utils.getScope(scope, prop, this.thisSymbol)\n\
\n\
      show(el);\n\
      if(!val) hide(el);\n\
\n\
      next(el, val, scope);\n\
    }\n\
  },\n\
\n\
  /**\n\
   * Hide nodes for falsey values\n\
   * template: <div oz-if=\"person.active\"></div>\n\
   * context: { person: {active: false} }\n\
   * output: <div oz-if=\"person.active\" style=\"display:none\"></div>\n\
   */\n\
  bool: {\n\
    attr: 'oz-if',\n\
    render: function (el, ctx, prop, scope, next) {\n\
      var val = utils.get(ctx, prop, this.thisSymbol)\n\
        , self = this;\n\
\n\
      show(el);\n\
      if(!val || (Array.isArray(val) && val.length === 0)) hide(el);\n\
\n\
      next();\n\
    }\n\
  },\n\
\n\
  /**\n\
   * Iterate over array-like objects and namespace the resulting nodes to the value iterated over\n\
   * template: <div oz-each=\"people\"><p oz-text=\"name\"></p></div>\n\
   * context: { people: [ {name: 'Tobi'}, {name: 'Brian'} ] }\n\
   * output: <div oz-each=\"people\" oz-each-index=\"0\"><p oz-text=\"name\">Tobi</p></div>\n\
   *         <div oz-each=\"people\" oz-each-index=\"1\"><p oz-text=\"name\">Brian</p></div>\n\
   */\n\
  array: {\n\
    attr: 'oz-each',\n\
    not: '[oz-each-index]',\n\
    render: function (el, ctx, prop, scope, next) {\n\
      var newEl\n\
        , existing = {}\n\
        , after\n\
        , val = utils.get(ctx, prop, this.thisSymbol)\n\
        , self = this;\n\
\n\
      // nothing to do if there is no array at all\n\
      if(!val) return hide(el);\n\
\n\
      show(el);\n\
\n\
      // find all the existing elements\n\
      siblings(el, '[oz-each-index]').forEach(function (el, i) {\n\
\n\
        // remove elements that are no longer around\n\
        if(i >= val.length) return el.parentNode.removeChild(el);\n\
\n\
        existing[i] = el;\n\
      });\n\
\n\
      // use a for loop instead of `.forEach` to allow array-like values with a length property\n\
      for(var i=0; i<val.length; i++) {\n\
\n\
        after = existing[i + 1] || el;\n\
        newEl = existing[i] || el.cloneNode(true);\n\
\n\
        // we need to be able to reference this element later\n\
        attr(newEl).set('oz-each-index', i);\n\
\n\
        // insert in the correct ordering\n\
        after.parentNode.insertBefore(newEl, after);\n\
\n\
        next(newEl, val[i], utils.getScope(scope, prop + '.' + i, self.thisSymbol));\n\
      }\n\
\n\
      // hide template element\n\
      hide(el);\n\
    }\n\
  },\n\
\n\
  /**\n\
   * Add text content to nodes\n\
   * template: <div oz-text=\"person.name\"></div>\n\
   * context: { person: {name: 'Tobi'} }\n\
   * output: <div oz-text=\"person.name\">Tobi</div>\n\
   */\n\
  string: {\n\
    attr: 'oz-text',\n\
    render: function (el, ctx, prop, scope, next) {\n\
      var val = utils.get(ctx, prop, this.thisSymbol) || ''\n\
        , self = this;\n\
\n\
      if(val !== undefined) text(el, String(val));\n\
\n\
      next();\n\
    }\n\
  },\n\
\n\
  /**\n\
   * Bind form values to context\n\
   * template: <input type=\"text\" oz-val=\"person.name\">\n\
   * context: { person: { name: 'Tobi' } }\n\
   * output: <input type=\"text\" value=\"Tobi\">\n\
   * template.on('change:person.name', fn); // fired when <input> is changed\n\
   */\n\
  // TODO: handle form elements like checkboxes, radio buttons\n\
  value: {\n\
    attr: 'oz-val',\n\
    render: function (el, ctx, prop, scope, next) {\n\
      var val = utils.get(ctx, prop, this.thisSymbol)\n\
        , self = this;\n\
\n\
      // set form value\n\
      if(val !== undefined) value(el, val);\n\
\n\
      // listen for changes to values\n\
      onChange(self.events, el, function (val) {\n\
        self._change(utils.getScope(scope, prop, self.thisSymbol), val);\n\
      });\n\
\n\
      next();\n\
    }\n\
  },\n\
\n\
  /**\n\
   * Listen for DOM events\n\
   * template: <div oz-evt=\"click:save\"></div>\n\
   * output: template.on('save', fn); // fired when <div> is clicked\n\
   */\n\
  event: {\n\
    attr: 'oz-evt',\n\
    render: function (el, ctx, prop, scope, next) {\n\
      var self = this;\n\
\n\
      utils.propSplit(prop, this.separator, this.equals, function (name, val) {\n\
\n\
        self.events.bind(el, name, function (e) {\n\
          self.emit(val, el, e, ctx);\n\
        });\n\
      });\n\
\n\
      next();\n\
    }\n\
  }\n\
\n\
};\n\
\n\
\n\
/**\n\
 * Utility functions\n\
 */\n\
\n\
// hide element\n\
function hide(el) {\n\
  css(el, {\n\
    display: 'none'\n\
  });\n\
}\n\
\n\
// unhide element (does not guarantee that it will be shown, just that it won't be hidden at this level)\n\
function show(el) {\n\
  css(el, {\n\
    display: ''\n\
  });\n\
}\n\
\n\
// bind an element to all potential `change` events, but only trigger when content changes\n\
function onChange(events, el, fn) {\n\
\n\
  var val = value(el);\n\
\n\
  function changed(e) {\n\
    if(value(el) !== val) fn(value(el));\n\
    val = value(el);\n\
  }\n\
\n\
  events.bind(el, 'click', changed);\n\
  events.bind(el, 'change', changed);\n\
  events.bind(el, 'keyup', changed);\n\
}//@ sourceURL=treygriffith-oz/lib/tags.js"
));
require.register("treygriffith-oz/lib/utils.js", Function("exports, require, module",
"// get the value of a property in a context\n\
exports.get = function get(ctx, prop, thisSymbol) {\n\
  var val = ctx;\n\
\n\
  prop.split('.').forEach(function (part) {\n\
    if(part !== thisSymbol) {\n\
      if(!val) return val = null;\n\
      if(typeof val[part] === 'function') val = val[part]();\n\
      else val = val[part];\n\
    }\n\
  });\n\
\n\
  return val;\n\
};\n\
\n\
// get the textual representation of current scope\n\
exports.getScope = function getScope(scope, prop, thisSymbol) {\n\
\n\
  var scopes = [];\n\
\n\
  ((scope || thisSymbol) + \".\" + prop).split('.').forEach(function (part) {\n\
    if(part !== thisSymbol) scopes.push(part);\n\
  });\n\
\n\
  return scopes.join('.');\n\
};\n\
\n\
// split a property into its constituent parts - similar to inline style declarations\n\
exports.propSplit = function propSplit(prop, separator, equals, fn) {\n\
  prop.split(separator).forEach(function (prop) {\n\
    if(!prop) return;\n\
\n\
    var parts = prop.split(equals).map(trim);\n\
\n\
    fn(parts[0], parts[1]);\n\
  });\n\
};\n\
\n\
// convenience trim function\n\
function trim(str) {\n\
  return str.trim();\n\
}//@ sourceURL=treygriffith-oz/lib/utils.js"
));
require.register("JayceTDE-pend/index.js", Function("exports, require, module",
"'use strict';\n\
\n\
var domify = require('domify')\n\
  , query = require('query')\n\
  , toString = Object.prototype.toString\n\
;\n\
\n\
function isArray(obj) {\n\
    return toString.call(obj) === '[object Array]';\n\
}\n\
\n\
function isArguments(obj) {\n\
    return toString.call(obj) === '[object Arguments]';\n\
}\n\
\n\
function processArguments(args, fn) {\n\
    if (isArray(args) || isArguments(args)) {\n\
        var i, l = args.length;\n\
        if (l > 1) {\n\
            i = 0;\n\
            while (i < l) {\n\
                processArguments(args[i], fn);\n\
                i += 1;\n\
            }\n\
            return;\n\
        } else {\n\
            args = args[0];\n\
        }\n\
    }\n\
    if (typeof(args) === 'string') {\n\
        try {\n\
            return processArguments(domify(args), fn);\n\
        } catch (e) {\n\
            args = document.createTextNode(args);\n\
        }\n\
    }\n\
    fn(args);\n\
}\n\
\n\
function Pend(el) {\n\
    if (typeof(el) === 'string') {\n\
        el = query(el);\n\
    }\n\
    this.el = el;\n\
}\n\
\n\
Pend.prototype.append = function () {\n\
    var self = this;\n\
    processArguments(arguments, function (el) {\n\
        self.el.appendChild(el);\n\
    });\n\
    return this;\n\
};\n\
\n\
Pend.prototype.prepend = function () {\n\
    var self = this;\n\
    processArguments(arguments, function (el) {\n\
        self.el.insertBefore(el, self.el.firstChild);\n\
    });\n\
    return this;\n\
};\n\
\n\
Pend.prototype.appendTo = function (el) {\n\
    if (typeof(el) === 'string') {\n\
        el = query(el);\n\
    }\n\
    el.appendChild(this.el);\n\
};\n\
\n\
Pend.prototype.prependTo = function (el) {\n\
    if (typeof(el) === 'string') {\n\
        el = query(el);\n\
    }\n\
    el.insertBefore(this.el, el.firstChild);\n\
};\n\
\n\
module.exports = function (el) {\n\
    return new Pend(el);\n\
};\n\
//@ sourceURL=JayceTDE-pend/index.js"
));
require.register("board/index.js", Function("exports, require, module",
"var Oz = require('oz')\n\
  , Emitter = require('emitter')\n\
  , attr = require('attr')\n\
  , boardTemplate = require('./template');\n\
\n\
\n\
module.exports = Board;\n\
\n\
\n\
function Board(n) {\n\
  var board = this;\n\
\n\
  this.template = Oz(boardTemplate);\n\
\n\
  this.template.on('select', function (el, e, ctx) {\n\
    // let the game know that a cell was selected\n\
    var x = parseInt(attr(el).get('data-x'), 10)\n\
      , y = parseInt(attr(el).get('data-y'), 10);\n\
\n\
    board.emit('select', board.grid[x][y]);\n\
  });\n\
\n\
  this.generateGrid(n);\n\
}\n\
\n\
Emitter(Board.prototype);\n\
\n\
Board.prototype.generateGrid = function (n) {\n\
\n\
  this.grid = [];\n\
\n\
  var i=0;\n\
\n\
  for(var x=0; x<n; x++) {\n\
    this.grid[x] = [];\n\
    for(var y=0; y<n; y++) {\n\
      this.grid[x][y] = new Cell(x, y, i);\n\
      i++;\n\
    }\n\
  }\n\
};\n\
\n\
Board.prototype.render = function () {\n\
  return this.template.render(this);\n\
};\n\
\n\
Board.prototype.update = function () {\n\
  this.template.update(this);\n\
};\n\
\n\
\n\
function Cell(x, y, i) {\n\
  this.x = x;\n\
  this.y = y;\n\
  this.i = i;\n\
  this.player = false;\n\
}\n\
\n\
Cell.prototype.contents = function () {\n\
  return this.player ? this.player.symbol : \"\";\n\
};//@ sourceURL=board/index.js"
));
require.register("board/template.js", Function("exports, require, module",
"module.exports = '<div class=\"board\">\\n\
  \\n\
  <div oz-each=\"grid\" class=\"row\">\\n\
    <div oz-each=\"@\" class=\"cell\">\\n\
      <div oz-text=\"contents\" oz-evt=\"click:select\" oz-attr=\"data-x:x;data-y:y\"></div>\\n\
    </div>\\n\
  </div>\\n\
</div>';//@ sourceURL=board/template.js"
));
require.register("game/index.js", Function("exports, require, module",
"/**\n\
 * Dependencies\n\
 */\n\
var Oz = require('oz')\n\
  , pend = require('pend')\n\
  , Board = require('board')\n\
  , gameTemplate = require('./template');\n\
\n\
\n\
/**\n\
 * Export constructor\n\
 */\n\
module.exports = Game;\n\
\n\
function Game() {\n\
  var game = this\n\
    , template = this.template = Oz(gameTemplate);\n\
\n\
  this.inProgress = true;\n\
\n\
  this.generatePlayers(2);\n\
\n\
  this.generateBoard(3);\n\
\n\
  this.template.on('newGame', function () {\n\
    // build a new game\n\
    Game.create(template.rendered[0].parentNode);\n\
\n\
    // get rid of this game\n\
    template.rendered.forEach(function (el) {\n\
      el.parentNode.removeChild(el);\n\
    });\n\
  });\n\
\n\
  this.template.on('undo', function () {\n\
    if(game.lastTurn) {\n\
      var cell = game.lastTurn\n\
        , player = cell.player;\n\
\n\
      player.cells.splice(player.cells.indexOf(cell), 1);\n\
      cell.player = false;\n\
      game.nextTurn();\n\
\n\
    }\n\
  });\n\
}\n\
\n\
Game.create = function (el) {\n\
  var game = new Game();\n\
  pend(el).append(game.render());\n\
\n\
  return game;\n\
};\n\
\n\
Game.prototype.gameOver = function () {\n\
  return !this.inProgress;\n\
};\n\
\n\
Game.prototype.render = function () {\n\
  var ret = this.template.render(this);\n\
\n\
  pend(this.template.rendered[0]).prepend(this.board.render());\n\
\n\
  return ret;\n\
};\n\
\n\
Game.prototype.update = function () {\n\
  this.template.update(this);\n\
  this.board.update();\n\
};\n\
\n\
/**\n\
 * Create players for the game\n\
 * @param  {Number} n Number of players to create\n\
 */\n\
Game.prototype.generatePlayers = function (n) {\n\
  this.players = [];\n\
\n\
  for(var i=0; i<n; i++) {\n\
    this.players.push({\n\
      name: !i ? 'Player A' : 'Player B',\n\
      turn: !i,\n\
      turnClass: function () {\n\
        return this.turn ? \"turn\" : \"\";\n\
      },\n\
      symbol: !i ? 'X' : 'O',\n\
      cells: []\n\
    });\n\
\n\
    if(!i) this.turn = this.players[i];\n\
  }\n\
};\n\
\n\
\n\
Game.prototype.generateBoard = function (n) {\n\
  var game = this\n\
    , board = this.board = new Board(n);\n\
\n\
  this.board.on('select', function (cell) {\n\
    var player = game.turn;\n\
\n\
    cell.player = player;\n\
    player.cells.push(cell);\n\
    game.lastTurn = cell;\n\
\n\
    game.checkForVictory();\n\
\n\
    game.nextTurn();\n\
  });\n\
};\n\
\n\
Game.prototype.nextTurn = function () {\n\
  var i = this.players.indexOf(this.turn);\n\
  this.turn.turn = false;\n\
  this.turn = this.players[i+1] || this.players[0];\n\
  this.turn.turn = true;\n\
\n\
  this.update();\n\
};\n\
\n\
\n\
Game.prototype.checkForVictory = function () {\n\
  if(this.isCatGame()) {\n\
    this.inProgress = false;\n\
    this.draw = true;\n\
\n\
    return;\n\
  }\n\
\n\
  this.winner = this.hasWinner();\n\
\n\
  if(this.winner) this.inProgress = false;\n\
};\n\
\n\
Game.prototype.isCatGame = function () {\n\
  var grid = this.board.grid;\n\
\n\
  for(var x=0; x<grid.length; x++) {\n\
    for(var y=0; y<grid[x].length; y++) {\n\
      if(!grid[x][y].player) return false;\n\
    }\n\
  }\n\
\n\
  return true;\n\
};\n\
\n\
Game.prototype.hasWinner = function () {\n\
  var grid = this.board.grid\n\
    , size = grid.length\n\
    , player;\n\
\n\
  for(var i=0; i<this.players.length; i++) {\n\
    player = this.players[i];\n\
\n\
    // min 3 cells to win\n\
    if(player.cells.length < 3) continue;\n\
\n\
    if(hasColumn(player.cells, size)) return player;\n\
\n\
    if(hasRow(player.cells, size)) return player;\n\
\n\
    if(hasDiagonal(player.cells, size)) return player;\n\
  }\n\
\n\
  return false;\n\
};\n\
\n\
function hasColumn(cells, size) {\n\
  for(var y=0; y<size; y++) {\n\
    for(var x=0; x<size; x++) {\n\
      if(!findCell(x, y , cells)) break;\n\
      if(x === (size-1)) return true;\n\
    }\n\
  }\n\
}\n\
\n\
function hasRow(cells, size) {\n\
  for(var x=0; x<size; x++) {\n\
    for(var y=0; y<size; y++) {\n\
      if(!findCell(x, y , cells)) break;\n\
      if(y === (size-1)) return true;\n\
    }\n\
  }\n\
}\n\
\n\
function hasDiagonal(cells, size) {\n\
  // top left to bottom right\n\
  for(var i=0; i<size; i++) {\n\
    if(!findCell(i, i, cells)) break;\n\
    if(i === (size-1)) return true;\n\
  }\n\
\n\
  // bottom left to top right\n\
  for(i=0; i<size; i++) {\n\
    if(!findCell(size - 1 - i, i, cells)) break;\n\
    if(i === (size-1)) return true;\n\
  }\n\
\n\
  return false;\n\
}\n\
\n\
function findCell(x, y, cells) {\n\
  for(var i=0; i<cells.length; i++) {\n\
    if(cells[i].x === x && cells[i].y === y) return cells[i];\n\
  }\n\
\n\
  return false;\n\
}//@ sourceURL=game/index.js"
));
require.register("game/template.js", Function("exports, require, module",
"module.exports = '<div class=\"game\">\\n\
\\n\
  <div oz-if=\"inProgress\" class=\"players\">\\n\
    <div oz-each=\"players\" class=\"player\">\\n\
      <span oz-text=\"name\" oz-attr=\"class:turnClass\"></span>\\n\
    </div>\\n\
  </div>\\n\
\\n\
  <button oz-if=\"inProgress\" oz-evt=\"click:undo\" class=\"undo\">Undo Last Move</button>\\n\
\\n\
  <div oz-if=\"gameOver\" class=\"gameOver\">\\n\
\\n\
    <div oz-if=\"draw\" class=\"draw\">\\n\
      DRAW\\n\
    </div>\\n\
\\n\
    <div oz-if=\"winner\" class=\"victory\">\\n\
      <span oz-text=\"winner.name\"></span> Wins!\\n\
    </div>\\n\
\\n\
    <button oz-evt=\"click:newGame\" class=\"new-game\">Play Again</button>\\n\
  </div>\\n\
\\n\
</div>';//@ sourceURL=game/template.js"
));
require.register("boot/index.js", Function("exports, require, module",
"var Game = require('game');\n\
\n\
Game.create(document.body);//@ sourceURL=boot/index.js"
));
require.register("locbox-challenge/index.js", Function("exports, require, module",
"require(\"boot\");//@ sourceURL=locbox-challenge/index.js"
));















require.alias("boot/index.js", "locbox-challenge/deps/boot/index.js");
require.alias("boot/index.js", "locbox-challenge/deps/boot/index.js");
require.alias("boot/index.js", "boot/index.js");
require.alias("game/index.js", "boot/deps/game/index.js");
require.alias("game/template.js", "boot/deps/game/template.js");
require.alias("game/index.js", "boot/deps/game/index.js");
require.alias("treygriffith-oz/index.js", "game/deps/oz/index.js");
require.alias("treygriffith-oz/lib/oz.js", "game/deps/oz/lib/oz.js");
require.alias("treygriffith-oz/lib/tags.js", "game/deps/oz/lib/tags.js");
require.alias("treygriffith-oz/lib/utils.js", "game/deps/oz/lib/utils.js");
require.alias("treygriffith-oz/index.js", "game/deps/oz/index.js");
require.alias("component-domify/index.js", "treygriffith-oz/deps/domify/index.js");

require.alias("treygriffith-closest/index.js", "treygriffith-oz/deps/closest/index.js");
require.alias("treygriffith-closest/index.js", "treygriffith-oz/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "treygriffith-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("treygriffith-closest/index.js", "treygriffith-closest/index.js");
require.alias("component-clone/index.js", "treygriffith-oz/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-matches-selector/index.js", "treygriffith-oz/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-css/index.js", "treygriffith-oz/deps/css/index.js");

require.alias("component-emitter/index.js", "treygriffith-oz/deps/emitter/index.js");

require.alias("treygriffith-events/index.js", "treygriffith-oz/deps/events/index.js");
require.alias("treygriffith-events/index.js", "treygriffith-oz/deps/events/index.js");
require.alias("component-event/index.js", "treygriffith-events/deps/event/index.js");

require.alias("treygriffith-events/index.js", "treygriffith-events/index.js");
require.alias("ramitos-children/src/children.js", "treygriffith-oz/deps/children/src/children.js");
require.alias("ramitos-children/src/children.js", "treygriffith-oz/deps/children/index.js");
require.alias("component-matches-selector/index.js", "ramitos-children/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ramitos-children/src/children.js", "ramitos-children/index.js");
require.alias("ramitos-siblings/src/siblings.js", "treygriffith-oz/deps/siblings/src/siblings.js");
require.alias("ramitos-siblings/src/siblings.js", "treygriffith-oz/deps/siblings/index.js");
require.alias("ramitos-children/src/children.js", "ramitos-siblings/deps/children/src/children.js");
require.alias("ramitos-children/src/children.js", "ramitos-siblings/deps/children/index.js");
require.alias("component-matches-selector/index.js", "ramitos-children/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ramitos-children/src/children.js", "ramitos-children/index.js");
require.alias("ramitos-siblings/src/siblings.js", "ramitos-siblings/index.js");
require.alias("treygriffith-find-with-self/index.js", "treygriffith-oz/deps/find-with-self/index.js");
require.alias("treygriffith-find-with-self/index.js", "treygriffith-oz/deps/find-with-self/index.js");
require.alias("component-query/index.js", "treygriffith-find-with-self/deps/query/index.js");

require.alias("component-matches-selector/index.js", "treygriffith-find-with-self/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ForbesLindesay-to-element-array/index.js", "treygriffith-find-with-self/deps/to-element-array/index.js");
require.alias("timoxley-to-array/index.js", "ForbesLindesay-to-element-array/deps/to-array/index.js");

require.alias("treygriffith-find-with-self/index.js", "treygriffith-find-with-self/index.js");
require.alias("matthewp-attr/index.js", "treygriffith-oz/deps/attr/index.js");

require.alias("matthewp-text/index.js", "treygriffith-oz/deps/text/index.js");

require.alias("component-value/index.js", "treygriffith-oz/deps/value/index.js");
require.alias("component-value/index.js", "treygriffith-oz/deps/value/index.js");
require.alias("component-type/index.js", "component-value/deps/type/index.js");

require.alias("component-value/index.js", "component-value/index.js");
require.alias("treygriffith-oz/index.js", "treygriffith-oz/index.js");
require.alias("JayceTDE-pend/index.js", "game/deps/pend/index.js");
require.alias("JayceTDE-pend/index.js", "game/deps/pend/index.js");
require.alias("component-query/index.js", "JayceTDE-pend/deps/query/index.js");

require.alias("component-domify/index.js", "JayceTDE-pend/deps/domify/index.js");

require.alias("JayceTDE-pend/index.js", "JayceTDE-pend/index.js");
require.alias("board/index.js", "game/deps/board/index.js");
require.alias("board/template.js", "game/deps/board/template.js");
require.alias("board/index.js", "game/deps/board/index.js");
require.alias("treygriffith-oz/index.js", "board/deps/oz/index.js");
require.alias("treygriffith-oz/lib/oz.js", "board/deps/oz/lib/oz.js");
require.alias("treygriffith-oz/lib/tags.js", "board/deps/oz/lib/tags.js");
require.alias("treygriffith-oz/lib/utils.js", "board/deps/oz/lib/utils.js");
require.alias("treygriffith-oz/index.js", "board/deps/oz/index.js");
require.alias("component-domify/index.js", "treygriffith-oz/deps/domify/index.js");

require.alias("treygriffith-closest/index.js", "treygriffith-oz/deps/closest/index.js");
require.alias("treygriffith-closest/index.js", "treygriffith-oz/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "treygriffith-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("treygriffith-closest/index.js", "treygriffith-closest/index.js");
require.alias("component-clone/index.js", "treygriffith-oz/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-matches-selector/index.js", "treygriffith-oz/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-css/index.js", "treygriffith-oz/deps/css/index.js");

require.alias("component-emitter/index.js", "treygriffith-oz/deps/emitter/index.js");

require.alias("treygriffith-events/index.js", "treygriffith-oz/deps/events/index.js");
require.alias("treygriffith-events/index.js", "treygriffith-oz/deps/events/index.js");
require.alias("component-event/index.js", "treygriffith-events/deps/event/index.js");

require.alias("treygriffith-events/index.js", "treygriffith-events/index.js");
require.alias("ramitos-children/src/children.js", "treygriffith-oz/deps/children/src/children.js");
require.alias("ramitos-children/src/children.js", "treygriffith-oz/deps/children/index.js");
require.alias("component-matches-selector/index.js", "ramitos-children/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ramitos-children/src/children.js", "ramitos-children/index.js");
require.alias("ramitos-siblings/src/siblings.js", "treygriffith-oz/deps/siblings/src/siblings.js");
require.alias("ramitos-siblings/src/siblings.js", "treygriffith-oz/deps/siblings/index.js");
require.alias("ramitos-children/src/children.js", "ramitos-siblings/deps/children/src/children.js");
require.alias("ramitos-children/src/children.js", "ramitos-siblings/deps/children/index.js");
require.alias("component-matches-selector/index.js", "ramitos-children/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ramitos-children/src/children.js", "ramitos-children/index.js");
require.alias("ramitos-siblings/src/siblings.js", "ramitos-siblings/index.js");
require.alias("treygriffith-find-with-self/index.js", "treygriffith-oz/deps/find-with-self/index.js");
require.alias("treygriffith-find-with-self/index.js", "treygriffith-oz/deps/find-with-self/index.js");
require.alias("component-query/index.js", "treygriffith-find-with-self/deps/query/index.js");

require.alias("component-matches-selector/index.js", "treygriffith-find-with-self/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("ForbesLindesay-to-element-array/index.js", "treygriffith-find-with-self/deps/to-element-array/index.js");
require.alias("timoxley-to-array/index.js", "ForbesLindesay-to-element-array/deps/to-array/index.js");

require.alias("treygriffith-find-with-self/index.js", "treygriffith-find-with-self/index.js");
require.alias("matthewp-attr/index.js", "treygriffith-oz/deps/attr/index.js");

require.alias("matthewp-text/index.js", "treygriffith-oz/deps/text/index.js");

require.alias("component-value/index.js", "treygriffith-oz/deps/value/index.js");
require.alias("component-value/index.js", "treygriffith-oz/deps/value/index.js");
require.alias("component-type/index.js", "component-value/deps/type/index.js");

require.alias("component-value/index.js", "component-value/index.js");
require.alias("treygriffith-oz/index.js", "treygriffith-oz/index.js");
require.alias("component-emitter/index.js", "board/deps/emitter/index.js");

require.alias("matthewp-attr/index.js", "board/deps/attr/index.js");

require.alias("board/index.js", "board/index.js");
require.alias("game/index.js", "game/index.js");
require.alias("boot/index.js", "boot/index.js");
require.alias("locbox-challenge/index.js", "locbox-challenge/index.js");