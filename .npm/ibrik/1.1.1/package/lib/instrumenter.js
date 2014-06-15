// Generated by CoffeeScript 2.0.0-beta8
void function () {
  var _, coffee, escodegen, estraverse, istanbul;
  coffee = require('coffee-script-redux');
  istanbul = require('istanbul');
  escodegen = require('escodegen');
  estraverse = require('estraverse');
  _ = require('lodash');
  StructuredCode = function () {
    function StructuredCode(code) {
      this.cursors = this.generateOffsets(code);
      this.length = this.cursors.length;
    }
    StructuredCode.prototype.generateOffsets = function (code) {
      var cursor, reg, res, result;
      reg = /(?:\r\n|[\r\n\u2028\u2029])/g;
      result = [0];
      while (res = reg.exec(code)) {
        cursor = res.index + res[0].length;
        reg.lastIndex = cursor;
        result.push(cursor);
      }
      return result;
    };
    StructuredCode.prototype.column = function (offset) {
      return this.loc(offset).column;
    };
    StructuredCode.prototype.line = function (offset) {
      return this.loc(offset).line;
    };
    StructuredCode.prototype.loc = function (offset) {
      var column, index, line;
      index = _.sortedIndex(this.cursors, offset);
      if (this.cursors.length > index && this.cursors[index] === offset) {
        column = 0;
        line = index + 1;
      } else {
        column = offset - this.cursors[index - 1];
        line = index;
      }
      return {
        column: column,
        line: line
      };
    };
    return StructuredCode;
  }();
  Instrumenter = function (super$) {
    extends$(Instrumenter, super$);
    function Instrumenter(opt) {
      istanbul.Instrumenter.call(this, opt);
    }
    Instrumenter.prototype.instrumentSync = function (code, filename) {
      var csast, program;
      filename = filename || '' + Date.now() + '.js';
      if (!(typeof code === 'string'))
        throw new Error('Code must be string');
      csast = coffee.parse(code, {
        optimise: false,
        raw: true
      });
      program = coffee.compile(csast, { bare: true });
      this.fixupLoc(program, code);
      return this.instrumentASTSync(program, filename, code);
    };
    Instrumenter.prototype.fixupLoc = function (program) {
      var structured;
      structured = new StructuredCode(program.raw);
      return estraverse.traverse(program, {
        leave: function (node, parent) {
          var loc;
          if (null != node.range) {
            loc = {
              start: null,
              end: structured.loc(node.range[1])
            };
            if (null != node.loc) {
              loc.start = node.loc.start;
            } else {
              loc.start = structured.loc(node.range[0]);
            }
            node.loc = loc;
          } else {
            node.loc = function () {
              switch (node.type) {
              case 'BlockStatement':
                return {
                  start: node.body[0].loc.start,
                  end: node.body[node.body.length - 1].loc.end
                };
              case 'VariableDeclarator':
                if (null != (null != node && null != node.init ? node.init.loc : void 0)) {
                  return {
                    start: node.id.loc.start,
                    end: node.init.loc.end
                  };
                } else {
                  return node.id.loc;
                }
              case 'ExpressionStatement':
                return node.expression.loc;
              case 'ReturnStatement':
                if (null != node.argument) {
                  return node.argument.loc;
                } else {
                  return node.loc;
                }
              case 'VariableDeclaration':
                return {
                  start: node.declarations[0].loc.start,
                  end: node.declarations[node.declarations.length - 1].loc.end
                };
              default:
                return {
                  start: {
                    line: 0,
                    column: 0
                  },
                  end: {
                    line: 0,
                    column: 0
                  }
                };
              }
            }.call(this);
          }
        }
      });
    };
    return Instrumenter;
  }(istanbul.Instrumenter);
  module.exports = Instrumenter;
  function isOwn$(o, p) {
    return {}.hasOwnProperty.call(o, p);
  }
  function extends$(child, parent) {
    for (var key in parent)
      if (isOwn$(parent, key))
        child[key] = parent[key];
    function ctor() {
      this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }
}.call(this);
