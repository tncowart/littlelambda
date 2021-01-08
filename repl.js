var repl = require("repl");
var littleLisp = require("./littlelambda").littleLambda;

repl.start({
  prompt: "> ",
  eval: function(cmd, context, filename, callback) {
    var ret = littleLambda.interpret(littleLambda.parse(cmd));
    callback(null, ret);
  }
});
