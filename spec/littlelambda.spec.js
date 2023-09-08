import { parse, Lambda } from "../littlelambda.js";

var is = function (input, type) {
  return Object.prototype.toString.call(input) === "[object " + type + "]";
};

function arrayCompare(first, second) {
  if (first.length != second.length) {
    return false;
  }

  let equal = true;
  for (let i = 0; i < first.length && equal; i++) {
    if (Array.isArray(first[i]) && Array.isArray(second[i])) {
      equal &&= arrayCompare(first[i], second[i]);
    } else if (
      first[i].constructor.name === "Lambda" &&
      second[i].constructor.name === "Lambda"
    ) {
      equal &&= lambdaCompare(first[i], second[i]);
    } else {
      equal &&= first[i] === second[i];
    }
  }

  return equal;
}

function lambdaCompare(first, second) {
  return (
    first.constructor.name === "Lambda" &&
    second.constructor.name === "Lambda" &&
    arrayCompare(first.parameters, second.parameters) &&
    arrayCompare(first.body, second.body)
  );
}

function customFTester(first, second) {
  if (
    first.constructor.name === "Lambda" &&
    second.constructor.name === "Lambda"
  ) {
    return lambdaCompare(first, second);
  }
}

beforeEach(function () {
  jasmine.addCustomEqualityTester(customFTester);
});

// takes an AST and replaces type annotated nodes with raw values
var unannotate = function (input) {
  if (is(input, "Array")) {
    if (input[0] === undefined) {
      return [];
    } else if (is(input[0], "Array")) {
      return [unannotate(input[0])].concat(unannotate(input.slice(1)));
    } else {
      return unannotate(input[0]).concat(unannotate(input.slice(1)));
    }
  } else {
    return [input["original-value"] ?? input.value];
  }
};

describe("littleLisp", function () {
  describe("parse", function () {
    it("should lex not parse a single atom", function () {
      expect(() => {
        parse("a").value;
      }).toThrow("Invalid syntax");
    });

    it("should lex an atom in a list", function () {
      expect(parse("()")).toEqual([]);
    });

    it("should lex multi atom list", function () {
      expect(parse("(hi you)")).toEqual(["hi", "you"]);
    });

    it("should lex list containing list", function () {
      expect(parse("((x))")).toEqual([["x"]]);
    });

    it("should lex list containing list", function () {
      expect(parse("(x (x))")).toEqual(["x", ["x"]]);
    });

    it("should lex list containing list", function () {
      expect(parse("(x y)")).toEqual(["x", "y"]);
    });

    it("should lex list containing list", function () {
      expect(parse("(x (y) z)")).toEqual(["x", ["y"], "z"]);
    });

    it("should lex list containing list", function () {
      expect(parse("(x (y) (a b c))")).toEqual(["x", ["y"], ["a", "b", "c"]]);
    });

    it("should lex function", function () {
      expect(parse("(\\ (x y) (x y))")).toEqual(
        new Lambda(["x", "y"], ["x", "y"])
      );
    });

    it("should lex application", function () {
      expect(parse("((\\ (x y) (x y)) a b)")).toEqual([
        new Lambda(["x", "y"], ["x", "y"]),
        "a",
        "b",
      ]);
    });
  });

  // describe("alpha reduction", function () {
  //   it("should return list of identifiers", function () {
  //     expect(unannotate(t.alphaConvert(parse("(a b 3)")))).toEqual([
  //       "a",
  //       "b",
  //       "3",
  //     ]);
  //   });

  //   it("should rename lambda bound identifiers", function () {
  //     expect(unannotate(t.alphaConvert(parse("(\\ (a b) (a b 3))")))).toEqual(
  //       ["\\", ["a", "b"], ["a", "b", "3"]]
  //     );
  //   });
  // });

  // describe("currying", function () {
  //   it("should do nothing to lambdas with zero parameters", function () {
  //     expect(unannotate(t.curry(parse("(\\ () (a b 3))")))).toEqual([
  //       "\\",
  //       [],
  //       ["a", "b", "3"],
  //     ]);
  //   });

  //   it("should do nothing to lambdas with one parameter", function () {
  //     expect(unannotate(t.curry(parse("(\\ (a) (a b 3))")))).toEqual([
  //       "\\",
  //       ["a"],
  //       ["a", "b", "3"],
  //     ]);
  //   });

  //   it("should curry lambdas with two parameters", function () {
  //     expect(unannotate(t.curry(parse("(\\ (a b) (a b 3))")))).toEqual([
  //       "\\",
  //       ["a"],
  //       ["\\", ["b"], ["a", "b", "3"]],
  //     ]);
  //   });

  //   it("should curry lambdas with multiple parameters", function () {
  //     expect(unannotate(t.curry(parse("(\\ (a b c) (a b 3))")))).toEqual([
  //       "\\",
  //       ["a"],
  //       ["\\", ["b"], ["\\", ["c"], ["a", "b", "3"]]],
  //     ]);
  //   });
  // });

  // describe("de-let", function () {
  //   it("should rename let bound identifiers", function () {
  //     expect(
  //       unannotate(
  //         t.delet(t.alphaConvert(parse("(let ((a 1) (b 2)) (\\ () (a b)))")))
  //       )
  //     ).toEqual(["\\", [], ["1", "2"]]);
  //   });

  //   it("should rename let and lambda bound identifiers", function () {
  //     expect(
  //       unannotate(
  //         t.delet(t.alphaConvert(parse("(let ((a 1) (b 2)) (\\ (b) (a b)))")))
  //       )
  //     ).toEqual(["\\", ["b"], ["1", "b"]]);
  //   });
  // });

  // describe("beta reduction", function () {
  //   it("should apply all possible arguments", function () {
  //     expect(
  //       unannotate(
  //         t.betaReduce(
  //           t.alphaConvert(parse("((\\ (a) (\\ (b) (a b))) (c d))"))
  //         )
  //       )
  //     ).toEqual(["\\", ["b"], [["c", "d"], "b"]]);
  //   });

  //   it("should apply all possible arguments", function () {
  //     expect(
  //       unannotate(
  //         t.betaReduce(
  //           t.alphaConvert(parse("((\\ (a) (\\ (b) (a b))) (c d) (q x))"))
  //         )
  //       )
  //     ).toEqual([
  //       ["c", "d"],
  //       ["q", "x"],
  //     ]);
  //   });

  //   it("should apply all possible arguments", function () {
  //     expect(
  //       unannotate(
  //         t.betaReduce(
  //           t.alphaConvert(
  //             parse("((\\ (a) (\\ (b) (a b))) (c d) (q x) (p o))")
  //           )
  //         )
  //       )
  //     ).toEqual([
  //       [
  //         ["c", "d"],
  //         ["q", "x"],
  //       ],
  //       ["p", "o"],
  //     ]);
  //   });
  // });

  // describe("interpret", function () {
  //   describe("lists", function () {
  //     it("should return empty list", function () {
  //       expect(unannotate(t.interpret(parse("()")))).toEqual([]);
  //     });

  //     it("should return false", function () {
  //       expect(
  //         unannotate(
  //           t.interpret(
  //             parse(`
  //       (let ((TRUE (\\ (x y) x))
  //             (FALSE (\\ (x y) y))
  //             (AND (\\ (x y) (x y x))))
  //            (AND TRUE FALSE))`)
  //           )
  //         )
  //       ).toEqual(["\\", ["x"], ["\\", ["y"], "y"]]);
  //     });

  //     it("should return true", function () {
  //       expect(
  //         unannotate(
  //           t.interpret(
  //             parse(`
  //       (let ((TRUE (\\ (x y) x))
  //             (FALSE (\\ (x y) y))
  //             (AND (\\ (x y) (x y x))))
  //            (AND TRUE TRUE))`)
  //           )
  //         )
  //       ).toEqual(["\\", ["x"], ["\\", ["y"], "x"]]);
  //     });
  //   });
  // });

  // describe("compile", function () {
  //   describe("lists", function () {
  //     it("should return empty list", function () {
  //       expect(unannotate(t.compile(parse("()")))).toEqual([]);
  //     });

  //     it("should return false", function () {
  //       let _false = t.compile(
  //         parse(`
  //       (let ((TRUE (\\ (x y) x))
  //             (FALSE (\\ (x y) y))
  //             (AND (\\ (x y) (x y x))))
  //            (AND TRUE FALSE))`)
  //       );

  //       expect(_false(1)(0)).toEqual(0);
  //     });

  //     it("should return true", function () {
  //       let _true = t.compile(
  //         parse(`
  //       (let ((TRUE (\\ (x y) x))
  //             (FALSE (\\ (x y) y))
  //             (AND (\\ (x y) (x y x))))
  //            (AND TRUE TRUE))`)
  //       );

  //       expect(_true(1)(0)).toEqual(1);
  //     });
  //   });
  // });
});
