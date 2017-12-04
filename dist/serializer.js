'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var css = require('css');

var _require = require('./replace-class-names'),
    replaceClassNames = _require.replaceClassNames;

function createSerializer(styleSheet, classNameReplacer) {
  function test(val) {
    return val && !val.withStyles && val.$$typeof === Symbol.for('react.test.json');
  }

  function print(val, printer) {
    var nodes = getNodes(val);
    markNodes(nodes);
    var selectors = getSelectors(nodes);
    var styles = getStyles(selectors);
    var printedVal = printer(val);

    return replaceClassNames(selectors, styles, printedVal, classNameReplacer);
  }

  function getNodes(node) {
    var nodes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    if (node.children) {
      node.children.forEach(function (child) {
        return getNodes(child, nodes);
      });
    }

    if (typeof node === 'object') {
      nodes.push(node);
    }

    return nodes;
  }

  function markNodes(nodes) {
    nodes.forEach(function (node) {
      node.withStyles = true;
    });
  }

  function getSelectors(nodes) {
    return nodes.reduce(function (selectors, node) {
      return getSelectorsFromProps(selectors, node.props);
    }, []);
  }

  function getSelectorsFromProps(selectors, props) {
    var className = props.className || props.class;
    if (className) {
      selectors = selectors.concat(className.toString().split(' ').map(function (cn) {
        return `.${cn}`;
      }));
    }
    var dataProps = Object.keys(props).reduce(function (dProps, key) {
      if (key.startsWith('data-')) {
        dProps.push(`[${key}]`);
      }
      return dProps;
    }, []);
    if (dataProps.length) {
      selectors = selectors.concat(dataProps);
    }
    return selectors;
  }

  function filterChildSelector(baseSelector) {
    if (baseSelector.slice(-1) === '>') {
      return baseSelector.slice(0, -1);
    }
    return baseSelector;
  }

  function getStyles(nodeSelectors) {
    var tags = typeof styleSheet === 'function' ? styleSheet().tags : styleSheet.tags;
    var styles = tags.map(function (tag) {
      return (/* istanbul ignore next */tag.textContent || ''
      );
    }).join('\n');
    var ast = css.parse(styles);
    var rules = ast.stylesheet.rules.filter(filter);
    var mediaQueries = getMediaQueries(ast, filter);

    ast.stylesheet.rules = [].concat(_toConsumableArray(rules), _toConsumableArray(mediaQueries));

    var ret = css.stringify(ast);
    return ret;

    function filter(rule) {
      if (rule.type === 'rule') {
        return rule.selectors.some(function (selector) {
          var baseSelector = filterChildSelector(selector.split(/:| |\./).filter(function (s) {
            return !!s;
          })[0]);
          return nodeSelectors.some(function (sel) {
            return sel === baseSelector || sel === `.${baseSelector}`;
          });
        });
      }
      return false;
    }
  }

  function getMediaQueries(ast, filter) {
    return ast.stylesheet.rules.filter(function (rule) {
      return rule.type === 'media' || rule.type === 'supports';
    }).reduce(function (acc, mediaQuery) {
      mediaQuery.rules = mediaQuery.rules.filter(filter);

      if (mediaQuery.rules.length) {
        return acc.concat(mediaQuery);
      }

      return acc;
    }, []);
  }
  return { test, print };
}

// doing this to make it easier for users to mock things
// like switching between development mode and whatnot.
var getGlamorStyleSheet = function getGlamorStyleSheet() {
  return require('glamor').styleSheet;
};
var glamorSerializer = createSerializer(getGlamorStyleSheet);
createSerializer.test = glamorSerializer.test;
createSerializer.print = glamorSerializer.print;

module.exports = createSerializer;