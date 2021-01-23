;(function(exports) {
  var debugPrint = x => {
    let p = y => {
      if (y instanceof Array) {
        return `(${y.map(p).join(" ")})`
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

    this.get = identifier => {
      if (identifier in this.scope) {
        return this.scope[identifier];
      } else if (this.parent !== undefined) {
        return this.parent.get(identifier);
      }
    };
  };

  var alpha = {}

  var alphaConvertId = (id) => {
    let idCopy = {...id}
    idCopy["value"] = `${id.value}-${alpha[id.value]}`
    idCopy["original-value"] = idCopy["original-value"] ?? id.value
    return idCopy
  };

  var alphaConvert = (input) => {
    if (input instanceof Array) {
      if (isFunction(input)) {
        let newParams = input[1].map(id => {
          alpha[id.value] = (alpha[id.value] ?? 0) + 1;
          return alphaConvertId(id, alpha);
        });
        return [input[0], newParams, alphaConvert(input[2], alpha)]
      } else {
        return input.map(x => alphaConvert(x, alpha));
      }
    } else if (input.type === "identifier") {
      if (alpha[input.value] === undefined) {
        return input;
      } else {
        return alphaConvertId(input, alpha);
      }
    }
  };

  var isFunction = input => {
    return input.length == 3 && input[0].value == '\\'
  }

  var curryList = input => {
    if (isFunction(input)) {
      if (input[1].length < 2) { return input }

      return input[1].reverse().reduce((acc, arg) => {
        return [input[0], [arg], acc]
      }, curry(input[2]))
    } else {
      return input.map(curry)
    }
  };

  var curry = input => {
    if (input instanceof Array) {
      return curryList(input);
    } else if (input.type === "identifier") {
      return input;
    }
  };

  // De-let replaces all uses of "let" named values with the actual value
  var deletList = (input, context) => {
    if (input.length == 3 && input[0].value === "let") {
      let ctx = input[1].reduce((acc, binding) => {
        acc.scope[binding[0].value] = binding[1]
        return acc
      }, new Context({}, context));
      return delet(input[2], ctx);
    } else {
      return input.map(x => delet(x, context));
    }
  }

  var delet = (input, context) => {
    if (context === undefined) {
      return delet(input, new Context({}))
    } else if (input instanceof Array) {
      return deletList(input, context);
    } else if (input.type === "identifier") {
      return context.get(input.value) ?? input;
    }
  }

  var isFunctionApplication = input => {
    return input instanceof Array && input.length > 1 && isFunction(input[0])
  }

  var replaceIdentifier = (item, identifier, replacement) => {
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

  var reduceLambda = (lambda, arg) => {
    let paramId = lambda[1][0];
    return replaceIdentifier(lambda[2], paramId, arg);
  }

  var betaReduce = input => {
    if (isFunctionApplication(input)) {
      return input.slice(1).reduce(function(acc, l) {
        if (!isFunction(acc[0])) { return acc }

        if (acc.slice(2).length == 0) { return reduceLambda(acc[0], l) } // were reducing with the last arg
        
        return betaReduce([reduceLambda(acc[0], l), ...acc.slice(2)])
      }, input)
    } else if (input instanceof Array) {
      return input.map(betaReduce)
    } else {
      return input
    }
  }

  var compile = input => {
    let c = i => {
      if (isFunction(i)) {
        return `${i[1][0].value} => { return ${c(i[2])} }`;
      } else if (i instanceof Array) {
        return `[${i.map(c).join(", ")}]`;
      } else {
        return i.value;
      }
    }

    // Never eval IRL
    return eval(c(input))
  }

  var id_checker = input => {
    if(input.indexOf("-") != -1) { throw `Invalid identifier: ${input}\n  "-" is not allowed in identifiers`}
    return { type:'identifier', value: input };
  };

  var parenthesize = (input, list) => {
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
        return parenthesize(input, list.concat(id_checker(token)));
      }
    }
  };

  var tokenize = input => {
    return input.replace(/\(/g, ' ( ')
                .replace(/\)/g, ' ) ')
                .trim()
                .split(/\s+/);
  };

  var interpret = input => {
    return betaReduce(delet(curry(input)))
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
