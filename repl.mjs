import { start } from "repl";
import { littleLambda } from "./littlelambda.js";

start({
  prompt: "> ",
  eval: function (cmd, context, filename, callback) {
    var ret = littleLambda.interpret(littleLambda.parse(cmd));
    callback(null, ret);
  },
});
