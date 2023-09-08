let debugPrint = (x) => {
  let p = (y) => {
    if (y instanceof Array) {
      return `(${y.map(p).join(" ")})`;
    } else {
      return y["original-value"] ?? y.value ?? y;
    }
  };
  console.log(p(x));
  return x;
};

let newAlphaValue = (() => {
  let alphaCounter = 0;
  return () => {
    let newValue = `v${alphaCounter}`;
    alphaCounter += 1;
    return newValue;
  };
})();

let Environment = function (scope = {}, parent = null) {
  this.scope = scope;
  this.parent = parent;

  this.get = (identifier) => {
    if (identifier in this.scope) {
      return this.scope[identifier];
    } else if (this.parent !== undefined) {
      return this.parent.get(identifier);
    }
  };

  this.set = (identifier, value) => {
    this.scope[identifier] = value;
  };
};

  let curryList = input => {
    if (isFunction(input)) {
      if (input[1].length < 2) { return input }

      return input[1].reverse().reduce((acc, arg) => {
        return [input[0], [arg], acc]
      }, curry(input[2]))
    } else {
      return input.map(curry)
    }
  };

  let curry = input => {
    if (input instanceof Array) {
      return curryList(input);
    } else if (input.type === "identifier") {
      return input;
    }
  };

  // De-let replaces all uses of "let" named values with the actual value
  let deletList = (input, context) => {
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

  let delet = (input, context) => {
    if (context === undefined) {
      return delet(input, new Context({}))
    } else if (input instanceof Array) {
      return deletList(input, context);
    } else if (input.type === "identifier") {
      return context.get(input.value) ?? input;
    }
  }

  let isFunctionApplication = input => {
    return input instanceof Array && input.length > 1 && isFunction(input[0])
  }

  let replaceIdentifier = (item, identifier, replacement) => {
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

  let reduceLambda = (lambda, arg) => {
    let paramId = lambda[1][0];
    return replaceIdentifier(lambda[2], paramId, arg);
  }

  let betaReduce = input => {
    if (isFunctionApplication(input)) {
      return input.slice(1).reduce(function (acc, l) {
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

  let compile = input => {
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

  let id_checker = input => {
    if (input.indexOf("-") != -1) { throw `Invalid identifier: ${input}\n  "-" is not allowed in identifiers` }
    return { type: 'identifier', value: input };
  };

  let parenthesize = (input, list) => {
    if (list === undefined) {
      return parenthesize(input, []);
    } else {
      let token = input.shift();
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
let tokenize = (input) => {
  return input.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
};

// let interpret = (input) => {
//   return betaReduce(delet(curry(input)));
// };
let parse = (input) => letize(tokenize(input));

export { parse, Environment };
