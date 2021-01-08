;(function(exports) {
  var debugPrint = x => {
    let p = y => {
      if (y instanceof Array) {
        return "(" + y.map(p).join(" ") + ")"
      } else {
        return y["original-value"] ?? y.value ?? y
      }
    }
    console.log(p(x))
    return x;
  }

  var Context = function(scope, parent) {
    this.scope = scope;
    this.parent = parent;

    this.get = function(identifier) {
      if (identifier in this.scope) {
        return this.scope[identifier];
      } else if (this.parent !== undefined) {
        return this.parent.get(identifier);
      }
    };
  };

  var alphaConvertId = function(id, alpha) {
    return {...id, 
      "value": id.value + "_" + alpha[id.value], 
      "original-value": id.value
    }
  };

  var special_forms = {
    let: function(input, alpha) {
      let newBindings = input[1].map(function(binding) {
        alpha[binding[0].value] = (alpha[binding[0].value] ?? 0) + 1
        return [alphaConvertId(binding[0], alpha), alphaConvert(binding[1], alpha)]
      });
      return [input[0], newBindings, alphaConvert(input[2], alpha)]
    },

    "\\": function(input, alpha) {
      let newParams = input[1].map(function(id) {
        alpha[id.value] = (alpha[id.value] ?? 0) + 1;
        return alphaConvertId(id, alpha);
      });
      return [input[0], newParams, alphaConvert(input[2], alpha)]
    }
  };

  var alphaConvertList = function(input, alpha) {
    // all special forms are 3 elements long
    if (input.length == 3 && input[0].value in special_forms) {
      return special_forms[input[0].value](input, alpha);
    } else {
      return input.map(x => alphaConvert(x, alpha));
    }
  };

  var alphaConvert = function(input, alpha) {
    if (alpha === undefined) {
      return alphaConvert(input, {});
    } else if (input instanceof Array) {
      return alphaConvertList(input, alpha);
    } else if (input.type === "identifier") {
      if (alpha[input.value] === undefined) {
        return input;
      } else {
        return alphaConvertId(input, alpha);
      }
    }
  };

  var curryList = function(input) {
    if (input.length == 3 && input[0].value == "\\") {
      if (input[1].length < 2) { return input }

      return input[1].reverse().reduce(function(acc, arg) {
        return [input[0], [arg], acc]
      }, curry(input[2]))
    } else {
      return input.map(curry)
    }
  };

  var curry = function(input) {
    if (input instanceof Array) {
      return curryList(input);
    } else if (input.type === "identifier") {
      return input;
    }
  };

  // Delet replaces all uses of "let" named values with the actual value
  var deletList = function(input, context) {
    if (input.length == 3 && input[0].value == "let") {
      let ctx = input[1].reduce(function(acc, binding) {
        acc.scope[binding[0].value] = binding[1]
        return acc
      }, new Context({}, context));
      return delet(input[2], ctx);
    } else {
      return input.map(x => delet(x, context));
    }
  }

  var delet = function(input, context) {
    if (context === undefined) {
      return delet(input, new Context({}))
    } else if (input instanceof Array) {
      return deletList(input, context);
    } else if (input.type === "identifier") {
      return context.get(input.value) ?? input;
    }
  }

  var isFunction = function(input) {
    return input.length == 3 && input[0].value == '\\'
  }

  var isFunctionApplication = function(input) {
    return input instanceof Array && input.length > 1 && isFunction(input[0])
  }

  var replaceIdentifier = function(item, identifier, replacement) {
    if (isFunction(item)) {
      return [item[0], item[1], replaceIdentifier(item[2], identifier, replacement)]
    } else if (item instanceof Array) {
      return item.map(x => replaceIdentifier(x, identifier, replacement))
    } else if (item.value === identifier.value) {
      return replacement
    } else {
      return item
    }
  }

  var reduceLambda = function(lambda, arg) {
    let paramId = lambda[1][0];
    return replaceIdentifier(lambda[2], paramId, arg);
  }

  var betaReduce = function(input) {
    if (isFunctionApplication(input)) {
      return input.slice(1).reduce(function(acc, l) {
        if (!isFunction(acc[0])) { return acc }

        if (acc.slice(2).length == 0) { return reduceLambda(acc[0], l) } // were doing the last arg
        
        return betaReduce([reduceLambda(acc[0], l), ...acc.slice(2)])
      }, input)
    } else if (input instanceof Array) {
      return input.map(betaReduce)
    } else {
      return input
    }
  }

  var compile = function(input) {
    let c = i => {
      if (isFunction(i)) {
        return i[1][0].value + " => { return " + c(i[2]) + " } ";
      } else if (i instanceof Array) {
        return " [" + i.map(c).join(", ") + "] ";
      } else {
        return i.value;
      }
    }

    // Never eval IRL
    return eval(c(input))
  }

  var categorize = function(input) {
    return { type:'identifier', value: input };
  };

  var parenthesize = function(input, list) {
    if (list === undefined) {
      return parenthesize(input, []);
    } else {
      var token = input.shift();
      if (token === undefined) {
        return list.pop();
      } else if (token === "(") {
        list.push(parenthesize(input, []));
        return parenthesize(input, list);
      } else if (token === ")") {
        return list;
      } else {
        return parenthesize(input, list.concat(categorize(token)));
      }
    }
  };

  var tokenize = function(input) {
    return input.replace(/\(/g, ' ( ')
                .replace(/\)/g, ' ) ')
                .trim()
                .split(/\s+/);
  };

  var interpret = function(input) {
    return betaReduce(delet(curry(alphaConvert(input))))
  }

  exports.littleLambda = {
    parse: input => parenthesize(tokenize(input)),
    interpret: interpret,
    alphaConvert: alphaConvert,
    curry: curry,
    delet: delet,
    betaReduce: betaReduce,
    compile: input => compile(interpret(input))
  };
})(typeof exports === 'undefined' ? this : exports);
