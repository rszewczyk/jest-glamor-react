'use strict';

function defaultClassNameReplacer(className, index) {
  return `glamor-${index}`;
}

var replaceClassNames = function replaceClassNames(selectors, styles, code) {
  var replacer = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : defaultClassNameReplacer;

  var index = 0;
  return selectors.reduce(function (acc, className) {
    if (className.indexOf('.css-') === 0) {
      var escapedRegex = new RegExp(className.replace('.', '').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
      return acc.replace(escapedRegex, replacer(className, index++));
    }
    return acc;
  }, `${styles ? `${styles}\n\n` : ''}${code}`);
};

module.exports = { replaceClassNames };