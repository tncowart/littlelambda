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
    } else if (this.parent) {
      return this.parent.get(identifier);
    }
  };

  this.set = (identifier, value) => {
    this.scope[identifier] = value;
  };
};

let Lambda = function (parameters, body) {
  this.parameters = parameters;
  this.body = body;

  this.alphaConvert = (value, newValue) => {
    if (value in this.parameters) {
      return;
    }
  };
  this.apply = (args) => {
    for (let arg of args) {
      let newArg = structuredClone(arg);
      let parameter = this.parameters.shift();
      this.alphaConvert(parameter, newAlphaValue());
    }
  };
};

let compile = (input) => {
  let c = (i) => {
    if (isFunction(i)) {
      return `${i[1][0].value} => { return ${c(i[2])} }`;
    } else if (i instanceof Array) {
      return `[${i.map(c).join(", ")}]`;
    } else {
      return i.value;
    }
  };

  // Never eval IRL
  return eval(c(input));
};

let paramaterize = (input) => {
  let args = [];
  let token = input.shift(); // "("
  token = input.shift();
  while (token != ")") {
    args.push(token);
    token = input.shift();
  }

  return args;
};

let functionize = (input, environment) => {
  let func = new Lambda(
    paramaterize(input),
    parenthesize(input, environment, null)
  );
  input.shift(); // remove final ) of function
  return func;
};

let letContext = (input) => {
  let environment = new Environment({}, null);
  input.shift(); // skip first (
  while (true) {
    let token = input.shift();
    if (token === "(") {
      let identifier = input.shift();
      input.shift(); // skip first function (
      input.shift(); // skip \
      environment.set(identifier, functionize(input, environment));
    } else {
      break;
    }
  }

  input.shift(); // skip last )
  return environment;
};

let letize = (input) => {
  let token = input.shift();
  if (token === "(") {
    let lookahead = input.shift();
    if (lookahead == "let") {
      let environment = letContext(input);
      return parenthesize(input, environment, null);
    } else {
      input.unshift(lookahead);
      input.unshift(token);
      return parenthesize(input, new Environment({}, null), null);
    }
  } else {
    throw "Invalid syntax";
  }
};

let parenthesize = (input, environment, list) => {
  let token = input.shift();
  if (token === undefined) {
    return list.pop();
  } else if (token === "(") {
    if (list == null) {
      return parenthesize(input, environment, []);
    }

    list.push(parenthesize(input, environment, []));
    return parenthesize(input, environment, list);
  } else if (token === "\\") {
    list.push(functionize(input, environment));
    return parenthesize(input, environment, list);
  } else if (token === ")") {
    return list;
  } else {
    if (list == null) {
      list = [];
    }

    if (environment && environment.get(token)) {
      list.push(environment.get(token));
    } else {
      list.push(token);
    }

    return parenthesize(input, environment, list);
  }
};

let tokenize = (input) => {
  return input.replace(/\(/g, " ( ").replace(/\)/g, " ) ").trim().split(/\s+/);
};

// let interpret = (input) => {
//   return betaReduce(delet(curry(input)));
// };
let parse = (input) => letize(tokenize(input));

export { parse, Environment, Lambda };
